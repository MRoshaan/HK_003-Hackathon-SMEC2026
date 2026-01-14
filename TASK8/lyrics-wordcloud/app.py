from flask import Flask, render_template, request
import requests
from bs4 import BeautifulSoup
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import re
from collections import Counter

app = Flask(__name__)

def scrape_lyrics(song, artist):
    url = f"https://api.lyrics.ovh/v1/{artist}/{song}"
    response = requests.get(url)

    if response.status_code != 200:
        return ""

    data = response.json()
    return data.get("lyrics", "")

def generate_wordcloud(text):
    if not text.strip():
        return False

    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)

    stopwords = set(["the", "and", "is", "to", "of", "a", "in", "that", "it"])
    words = [word for word in text.split() if word not in stopwords]

    if len(words) == 0:
        return False

    wordcloud = WordCloud(
        width=800,
        height=400,
        background_color="white"
    ).generate(" ".join(words))

    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation="bilinear")
    plt.axis("off")
    plt.savefig("static/wordcloud.png")
    plt.close()

    return True


@app.route("/", methods=["GET", "POST"])
def index():
    error = None

    if request.method == "POST":
        song = request.form["song"]
        artist = request.form["artist"]

        lyrics = scrape_lyrics(song, artist)

        if not lyrics:
            error = "Lyrics not found. Try another song."
        else:
            success = generate_wordcloud(lyrics)
            if success:
                return render_template("index.html", image=True)

    return render_template("index.html", image=False, error=error)
if __name__ == "__main__":
    app.run(debug=True)

