from openai import OpenAI
import os

# Read the API key from an environment variable
openai_api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(
  organization='org-ulREcOlODSeaU4MGnUwI9n8Z',
  project='$PROJECT_ID',
)


completion = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
)

print(completion.choices[0].message)
