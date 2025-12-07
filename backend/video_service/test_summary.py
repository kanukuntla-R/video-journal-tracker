from backend.video_service.services.summarize import generate_summary

dummy_text = "Today I worked on my side project and felt pretty good about my progress, but I'm still a bit overwhelmed."

result = generate_summary(dummy_text)
print("Summary:", result)
