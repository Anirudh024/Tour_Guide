# Tour Guide: Your Multimodal AI Time Machine

Tour Guide is an intelligent travel companion designed to bridge the gap between seeing a monument and truly understanding its historical soul. Using a sophisticated "Chain of Agents" architecture, the app transforms simple visual inputs—like a photo of a ruin or a video of ancient scripture—into immersive, cinematic recreations of the past.

## 🚀 Key Features

* **Multimodal Intelligence:** Point your camera at any landmark to trigger the "Research Agent" (Gemini 2.5 Flash), which identifies the location, era, and historical context.
* **Cinematic Recreations:** Automatically generates 8k-resolution historical videos using the **Veo API**, allowing you to see what a site looked like in its prime.
* **Agentic Grounding:** Every visual generation is grounded in real-time research, ensuring that the "Visual Scene" is historically accurate and contextually relevant.
* **Asynchronous Processing:** Built with a non-blocking background architecture, allowing travelers to continue exploring while the "Digital Brain" synthesizes their personalized tour.

## 🏗️ Architecture

The project utilizes a linear intelligence pipeline to ensure data integrity and cinematic quality:

1. **Input:** User provides an image or video via the Flask API.
2. **Analysis:** The Research Agent extracts structured JSON data containing the era, location, and a visual script.
3. **Synthesis:** The system constructs a complex "Veo Prompt" based on the Research Agent's metadata.
4. **Generation:** The Veo Agent generates a high-fidelity video recreation.
5. **Delivery:** The final media is served back to the user, providing a "then vs. now" comparison.

## 🛠️ Tech Stack

* **Language:** Python
* **Framework:** Flask
* **AI Models:** * **Gemini 2.5 Flash:** For visual research, location grounding, and metadata synthesis.
* **Veo API:** For generating high-fidelity historical video content.


* **Concurrency:** Python Threading for asynchronous API orchestration.

## 📥 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/tour-guide.git
cd tour-guide

```


2. **Install dependencies:**
```bash
pip install flask google-generativeai google-genai

```


3. **Set your API Keys:**
```bash
export GEMINI_API_KEY='your_api_key_here'

```


4. **Run the application:**
```bash
python app.py

```



## 🌟 Inspiration

Inspired by the friction of modern travel, Tour Guide was built for the traveler who wants more than a static information board. It is designed to be a "Digital Brain" that provides a professional-level tour guide experience, grounded in facts and elevated by cinematic storytelling.

---
