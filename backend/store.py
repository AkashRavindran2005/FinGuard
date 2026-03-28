from models import Portfolio, Asset, Rule
from supabase_client import supabase
import uuid
import time

def execute_query(query, retries=3):
    """Executes a Supabase query with automatic retry for httpx HTTP/2 disconnects."""
    for attempt in range(retries):
        try:
            return query.execute()
        except Exception as e:
            if attempt == retries - 1:
                raise e
            if 'Server disconnected' in str(e) or 'ProtocolError' in str(e):
                time.sleep(0.5)
            else:
                raise e

def _get_or_create_portfolio_id(user_id: str) -> str:
    res = execute_query(supabase.table("portfolios").select("*").eq("user_id", user_id))
    if res.data and len(res.data) > 0:
        return str(res.data[0]["id"])
    
    # Create one, wrap in try-except for race conditions
    try:
        insert_res = execute_query(supabase.table("portfolios").insert({"user_id": user_id}))
        if insert_res.data and len(insert_res.data) > 0:
            return str(insert_res.data[0]["id"])
    except Exception as e:
        # If another concurrent request just inserted it, 23505 duplicate key violates unique_user_portfolio
        error_str = str(e)
        if '23505' in error_str or 'duplicate key' in error_str.lower() or 'duplicate' in error_str.lower():
            res_retry = execute_query(supabase.table("portfolios").select("*").eq("user_id", user_id))
            if res_retry.data and len(res_retry.data) > 0:
                return str(res_retry.data[0]["id"])
        print(f"ERROR in _get_or_create_portfolio_id: {e}")
    
    return "default"

def get_portfolio(user_id: str) -> Portfolio:
    pid = _get_or_create_portfolio_id(user_id)
    if pid == "default":
        return Portfolio(id="default", name="My Portfolio", total_value=1000000.0, assets=[])

    port_res = execute_query(supabase.table("portfolios").select("*").eq("id", pid))
    port_data = port_res.data[0] if port_res.data else {"id": pid, "name": "My Portfolio", "total_value": 1000000.0}
    
    # Get assets
    assets_res = execute_query(supabase.table("assets").select("*").eq("portfolio_id", pid))
    assets = []
    if assets_res.data:
        valid_keys = Asset.model_fields.keys()
        for a in assets_res.data:
            clean_a = {k: v for k, v in a.items() if k in valid_keys}
            assets.append(Asset(**clean_a))
    
    return Portfolio(
        id=str(port_data.get("id", pid)),
        name=port_data.get("name", "My Portfolio"),
        total_value=float(port_data.get("total_value") or 1000000.0),
        assets=assets
    )

def update_portfolio_value(user_id: str, new_value: float):
    pid = _get_or_create_portfolio_id(user_id)
    execute_query(supabase.table("portfolios").update({"total_value": new_value}).eq("id", pid))

def add_asset(user_id: str, asset: Asset) -> Portfolio:
    pid = _get_or_create_portfolio_id(user_id)
    
    # Check if exists
    existing = execute_query(supabase.table("assets").select("*").eq("portfolio_id", pid).eq("ticker", asset.ticker.upper()))
    if existing.data and len(existing.data) > 0:
        execute_query(supabase.table("assets").delete().eq("id", existing.data[0]["id"]))
        
    # Insert new
    asset_data = asset.model_dump()
    asset_data["portfolio_id"] = pid
    execute_query(supabase.table("assets").insert(asset_data))
    
    # Recalculate weights
    _recalculate_weights(pid)
    
    return get_portfolio(user_id)

def remove_asset(user_id: str, ticker: str) -> Portfolio:
    pid = _get_or_create_portfolio_id(user_id)
    execute_query(supabase.table("assets").delete().eq("portfolio_id", pid).eq("ticker", ticker.upper()))
    _recalculate_weights(pid)
    return get_portfolio(user_id)

def _recalculate_weights(portfolio_id: str):
    assets_res = execute_query(supabase.table("assets").select("*").eq("portfolio_id", portfolio_id))
    assets = assets_res.data
    total = sum(a["weight"] for a in assets)
    if total > 0 and total != 100.0:
        for a in assets:
            new_weight = round((a["weight"] / total) * 100, 2)
            execute_query(supabase.table("assets").update({"weight": new_weight}).eq("id", a["id"]))

def get_rules(user_id: str) -> list[Rule]:
    res = execute_query(supabase.table("rules").select("*").eq("user_id", user_id))
    return [Rule(**r) for r in res.data]

def add_rule(user_id: str, rule: Rule) -> Rule:
    rule_data = rule.model_dump()
    rule_data["user_id"] = user_id
    # Ensure no id conflict, or let supabase generate
    if "id" in rule_data and len(rule_data["id"]) < 10:
        del rule_data["id"]
    
    res = execute_query(supabase.table("rules").insert(rule_data))
    if res.data and len(res.data) > 0:
        return Rule(**res.data[0])
    return rule

def delete_rule(user_id: str, rule_id: str) -> bool:
    res = execute_query(supabase.table("rules").delete().eq("user_id", user_id).eq("id", rule_id))
    return len(res.data) > 0 if res.data else True

def update_rules(user_id: str, rules: list[Rule]):
    for rule in rules:
        rule_data = rule.model_dump()
        rule_id = rule_data.pop("id")
        rule_data.pop("user_id", None)
        execute_query(supabase.table("rules").update(rule_data).eq("user_id", user_id).eq("id", rule_id))
