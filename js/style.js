/* ===========================
   1) Intro Fade Animation
=========================== */
window.addEventListener("load", () => {
  const intro = document.querySelector(".ax-intro");
  if (intro) {
    setTimeout(() => {
      intro.style.opacity = "0";
      setTimeout(() => intro.style.display = "none", 800);
    }, 1400);
  }
});

/* ===========================
   2) Theme Toggle
=========================== */
document.addEventListener("click", e => {
  if (e.target.id === "ax-theme-toggle") {
    document.body.classList.toggle("light-mode");
    e.target.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
  }
});

/* ===========================
   3) Home Page Search
=========================== */
function goSearch() {
  const q = document.querySelector("#ax-search-input")?.value.trim();
  const type = document.querySelector(".ax-tabs .active")?.dataset.type;
  if (q && q.length >= 2) {
    window.location.href = `searchResults.html?q=${encodeURIComponent(q)}&type=${type}`;
  }
}

document.querySelector("#ax-search-btn")?.addEventListener("click", goSearch);
document.querySelector("#ax-search-input")?.addEventListener("keypress", e => {
  if (e.key === "Enter") goSearch();
});

/* ===========================
   4) Search Again in Results Page
=========================== */
document.querySelector("#search-again")?.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    const q = e.target.value.trim();
    if (q.length >= 2) {
      window.location.href = `searchResults.html?q=${encodeURIComponent(q)}&type=web`;
    }
  }
});

/* ===========================
   5) Read Query Params & Init Search
=========================== */
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get("q");
const type = urlParams.get("type");
const resultsBox = document.getElementById("results");
const titleBox = document.getElementById("result-title");

if (resultsBox && query) {
  titleBox.innerHTML = `نتایج برای: <span style="color:#4bd3ff">${query}</span>`;

  if (type === "images") searchImages(query);
  else if (type === "videos") searchVideos(query);
  else if (type === "news") searchNews(query);
  else searchWeb(query);
}

/* ===========================
   Helper
=========================== */
function escapeHtml(unsafe) {
  return (unsafe + '').replace(/[&<>"'`=\/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
  })[s]);
}

/* ===========================
   6) Web Search (DuckDuckGo + Wikipedia)
=========================== */
function searchWeb(q) {
  resultsBox.innerHTML = `<div style="opacity:.8;padding:20px;text-align:center">در حال یافتن نتایج...</div>`;

  fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`)
    .then(r => r.json())
    .then(ddg => {
      let html = "";

      if (ddg.AbstractText) {
        html += `
        <div class="result-item">
          <div class="result-title">${escapeHtml(ddg.Heading)}</div>
          <div class="result-snippet">${escapeHtml(ddg.AbstractText)}</div>
        </div>`;
      }

      if (ddg.RelatedTopics) {
        ddg.RelatedTopics.slice(0, 7).forEach(t => {
          const text = t.Text || (t.Topics?.[0]?.Text) || "";
          const url = t.FirstURL || (t.Topics?.[0]?.FirstURL) || "";
          if (text) {
            html += `
            <div class="result-item" onclick="window.open('${url}', '_blank')">
              <div class="result-title">${escapeHtml(text)}</div>
              <div class="result-link">${escapeHtml(url)}</div>
            </div>`;
          }
        });
      }

      resultsBox.innerHTML = html || "⏳ دریافت نتایج تکمیلی...";

      fetch(`https://fa.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`)
        .then(r => r.json())
        .then(data => {
          if (data.query?.search?.length) {
            data.query.search.slice(0, 7).forEach(s => {
              const title = s.title;
              const snippet = s.snippet.replace(/<\/?[^>]+>/g, "");
              const link = `https://fa.wikipedia.org/wiki/${encodeURIComponent(title)}`;
              resultsBox.innerHTML += `
          <div class="result-item" onclick="window.open('${link}','_blank')">
            <div class="result-title">${escapeHtml(title)}</div>
            <div class="result-snippet">${escapeHtml(snippet)}</div>
          </div>`;
            });
          }
        });
    });
}

/* ===========================
   7) Image Search (DuckDuckGo i.js)
=========================== */
function searchImages(q) {
  resultsBox.innerHTML = `<div class="image-grid"></div>`;
  const grid = document.querySelector(".image-grid");

  fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(data => {
      data.results.slice(0, 30).forEach(img => {
        grid.innerHTML += `<img src="${img.thumbnail}" onclick="window.open('${img.image}','_blank')">`;
      });
    })
    .catch(() => { resultsBox.innerHTML = "⛔ مشکل در دریافت تصاویر."; });
}

/* ===========================
   8) Video Search (YouTube RSS)
=========================== */
function searchVideos(q) {
  resultsBox.innerHTML = "";
  fetch(`https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(q)}`)
    .then(r => r.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      data.querySelectorAll("entry").forEach(v => {
        const title = v.querySelector("title").textContent;
        const link = v.querySelector("link").getAttribute("href");
        resultsBox.innerHTML += `
      <div class="result-item" onclick="window.open('${link}','_blank')">
        <div class="result-title">${escapeHtml(title)}</div>
        <div class="result-snippet">🎥 ویدئو از YouTube</div>
      </div>`;
      });
    });
}

/* ===========================
   9) News Search (Google News RSS)
=========================== */
function searchNews(q) {
  resultsBox.innerHTML = "";
  fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fa&gl=IR&ceid=IR:fa`)
    .then(r => r.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      data.querySelectorAll("item").forEach(n => {
        const title = n.querySelector("title").textContent;
        const link = n.querySelector("link").textContent;
        resultsBox.innerHTML += `
      <div class="result-item" onclick="window.open('${link}','_blank')">
        <div class="result-title">${escapeHtml(title)}</div>
        <div class="result-snippet">📰 خبر</div>
      </div>`;
      });
    });
}

/* ===========================
   10) Tab Switching (Home Page)
=========================== */
document.querySelectorAll(".ax-tabs button")?.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".ax-tabs .active")?.classList.remove("active");
    btn.classList.add("active");
  });
});
