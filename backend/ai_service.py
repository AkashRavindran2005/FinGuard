import os
import json
import logging
import requests
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
# Using Zephyr 7B Beta for fast, robust inference (Mistral API deprecated)
API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"

def evaluate_macro_ai_rules(portfolio, news_headlines):
    """
    Evaluates the portfolio context against real-world news using Mistral AI.
    Returns an alert message string if triggered, else None.
    """
    if not HF_API_TOKEN:
        logger.warning("No HF_API_TOKEN found in environment. Skipping AI evaluation.")
        return None

    if not news_headlines:
        logger.info("No news headlines fetched. Skipping AI evaluation.")
        return None

    if not portfolio.assets:
        return None

    # Construct portfolio summary
    portfolio_summary = f"Total Value: ${portfolio.total_value:,.2f}\nAssets:\n"
    for a in portfolio.assets:
        portfolio_summary += f"- {a.ticker} ({a.name}, Sector: {a.sector}): {a.weight}%, Price: ${a.current_price}\n"

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

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        result = response.json()
        
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get("generated_text", "").strip()
            
            # Clean up potential markdown formatting code blocks returned by LLM
            if generated_text.startswith("```json"):
                generated_text = generated_text[7:]
            if generated_text.startswith("```"):
                generated_text = generated_text[3:]
            if generated_text.endswith("```"):
                generated_text = generated_text[:-3]
                
            generated_text = generated_text.strip()
            
            try:
                data = json.loads(generated_text)
                if data.get("triggered") and data.get("trigger_message"):
                    return data.get("trigger_message")
            except json.JSONDecodeError as je:
                logger.error(f"Failed to parse JSON from AI response: {generated_text}. Error: {je}")
                # Fallback: if it didn't output JSON but outputted text
                if len(generated_text) > 20 and "{" not in generated_text:
                    return f"AI Suggestion: {generated_text}"

    except Exception as e:
        logger.error(f"HF AI Evaluation failed: {e}")
        
    return None
