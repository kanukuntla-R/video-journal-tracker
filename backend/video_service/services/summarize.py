import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()
# openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_summary(transcript: str) -> str:
    response = client.chat.completions.create(
        model = "gpt-3.5-turbo",
        messages = [
            {"role": "system", "content": "You are a helpful assistant that summarizes journal entries."},
            {"role": "user", "content": f"Summarize this journal entry in 3 sentences:\n\n{transcript}"}
        ],
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

