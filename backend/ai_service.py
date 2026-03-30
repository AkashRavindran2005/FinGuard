import os
import json
import logging
import requests
import time
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# List of free-tier accessible HF models (frequently updated)
HF_MODELS = [
    "mistralai/Mistral-7B-Instruct-v0.1",
    "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
    "meta-llama/Llama-2-13b-chat-hf",
    "mistralai/Mixtral-8x7B-Instruct-v0.1"
]

_model_cache = {}

def get_hf_api_url(model_index=0):
    """Get HuggingFace API URL for the model."""
    if model_index < len(HF_MODELS):
        return f"https://api-inference.huggingface.co/models/{HF_MODELS[model_index]}"
    return None

def evaluate_macro_ai_rules(portfolio, news_headlines, custom_prompt=None):
    """
    Evaluates the portfolio context against real-world news using HuggingFace models.
    Returns an alert message string if triggered, else None gracefully.
    If custom_prompt is provided, uses that instead of the default macro prompt.
    """
    if not HF_API_TOKEN:
        logger.debug("No HF_API_TOKEN configured. AI evaluation unavailable.")
        return None

    if not news_headlines:
        return None

    if not portfolio.assets:
        return None

    # Construct portfolio summary
    portfolio_summary = f"Total Value: ${portfolio.total_value:,.2f}\nAssets:\n"
    for a in portfolio.assets:
        portfolio_summary += f"- {a.ticker} ({a.name}, Sector: {a.sector}): {a.weight}%, Price: ${a.current_price}\n"

    if custom_prompt:
        prompt = custom_prompt.replace("{portfolio}", portfolio_summary).replace("{news}", '; '.join(news_headlines))
    else:
        prompt = f"""[INST] You are an expert financial AI advisor. 
Current Breaking Global News:
{'; '.join(news_headlines)}

User's Existing Portfolio:
{portfolio_summary}

Analyze the breaking news and how it specifically impacts the sectors and assets in the user's portfolio.
Generate exactly ONE actionable alert (e.g. suggesting an asset to buy, sell, or a sector to reduce/increase exposure in) and a brief reason why based on the news.

Return your response strictly in valid JSON format with the following structure:
{{
  "triggered": true,
  "trigger_message": "<your 1-2 sentence actionable advice>"
}}
Do not return any other text, markdown, or explanations outside the JSON object.
[/INST]"""

    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "return_full_text": False,
            "temperature": 0.1
        }
    }

    # Try multiple models with retry logic
    for model_index in range(len(HF_MODELS)):
        model_name = HF_MODELS[model_index]
        
        # Skip if we know this model is permanently unavailable
        if _model_cache.get(f"{model_name}_failed", False):
            continue
        
        api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        
        for attempt in range(2):  # 2 attempts per model
            try:
                logger.debug(f"Calling {model_name} (attempt {attempt+1}/2)")
                resp = requests.post(api_url, headers=headers, json=payload, timeout=25)
                
                # Handle auth/access issues
                if resp.status_code in [401, 403]:
                    logger.debug(f"Access denied for {model_name} (status {resp.status_code})")
                    _model_cache[f"{model_name}_failed"] = True
                    break
                
                # Model not available - try next one
                if resp.status_code in [404, 410]:
                    logger.debug(f"Model {model_name} unavailable (status {resp.status_code})")
                    _model_cache[f"{model_name}_failed"] = True
                    break
                
                # Unexpected error - retry
                if resp.status_code != 200:
                    logger.debug(f"Status {resp.status_code} from {model_name}, retrying...")
                    if attempt == 0:
                        time.sleep(1)
                    continue
                
                # Parse successful response
                result = resp.json()
                if isinstance(result, list) and len(result) > 0:
                    text = result[0].get("generated_text", "").strip()
                    
                    # Clean markdown
                    for marker in ["```json", "```"]:
                        text = text.replace(marker, "")
                    text = text.strip()
                    
                    if custom_prompt:
                        # For custom prompts, return the text directly if it looks like an alert
                        if text and len(text) > 10:
                            return text
                    else:
                        try:
                            data = json.loads(text)
                            if data.get("triggered") and data.get("trigger_message"):
                                return data["trigger_message"]
                        except json.JSONDecodeError:
                            pass
                
                # Model worked but didn't give us useful output - try another
                break
                
            except requests.exceptions.Timeout:
                logger.debug(f"Timeout on {model_name} attempt {attempt+1}")
                if attempt == 1:
                    break
                time.sleep(1)
            except Exception as e:
                logger.debug(f"Error with {model_name}: {e}")
                if attempt == 0:
                    time.sleep(1)
    
    # All models unavailable - gracefully return None
    logger.debug("AI model evaluation skipped (models unavailable)")
    return None
