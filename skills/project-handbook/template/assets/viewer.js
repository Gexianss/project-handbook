/* Project Handbook viewer — renders data/ content. No build step.
   The template (this file) never changes after generation; AI maintains only data/. */
/* global marked, mermaid */
(function () {
  "use strict";

  const manifest = window.HANDBOOK_MANIFEST;
  const sidebar = document.getElementById("sidebar-nav");
  const content = document.getElementById("content");
  const projectName = document.getElementById("project-name");
  const generatedAt = document.getElementById("generated-at");

  if (!manifest || !Array.isArray(manifest.sections) || manifest.sections.length === 0) {
    content.innerHTML =
      "<p class='error'>data/manifest.js is missing or has no sections.</p>";
    return;
  }

  projectName.textContent = manifest.project || "Project Handbook";
  if (manifest.generatedAt) {
    generatedAt.textContent = "Generated " + manifest.generatedAt;
  }
  document.title = (manifest.project || "Project") + " — Handbook";

  mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "neutral" });

  for (const section of manifest.sections) {
    const a = document.createElement("a");
    a.href = "#" + section.id;
    a.textContent = section.title;
    a.dataset.id = section.id;
    sidebar.appendChild(a);
  }

  function currentSection() {
    const id = location.hash.replace(/^#/, "");
    return manifest.sections.find((s) => s.id === id) || manifest.sections[0];
  }

  function setActive(id) {
    for (const a of sidebar.querySelectorAll("a")) {
      a.classList.toggle("active", a.dataset.id === id);
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  let mermaidSeq = 0;

  function sectionMeta(section) {
    const bits = [];
    if (section.updatedAt) bits.push("Updated " + esc(section.updatedAt));
    if (manifest.commit) bits.push("verified at <code>" + esc(manifest.commit) + "</code>");
    return bits.length ? "<p class='page-meta'>" + bits.join(" · ") + "</p>" : "";
  }

  async function renderMarkdown(section, text) {
    content.innerHTML = sectionMeta(section) + marked.parse(text);
    const blocks = content.querySelectorAll("pre > code.language-mermaid");
    for (const code of blocks) {
      const holder = document.createElement("div");
      holder.className = "mermaid-diagram";
      code.parentElement.replaceWith(holder);
      try {
        const { svg } = await mermaid.render("mmd-" + mermaidSeq++, code.textContent);
        holder.innerHTML = svg;
      } catch (err) {
        holder.innerHTML = "<pre class='error'>Mermaid error: " + esc(err.message) + "</pre>";
      }
    }
  }

  const STATUSES = ["ok", "warn", "critical", "unknown"];

  function renderHealth(report) {
    const meta = report.meta || {};
    const facets = Array.isArray(report.facets) ? report.facets : [];
    let html = "<h1>Health Report</h1>";
    const metaBits = [
      meta.generatedAt ? "Generated " + esc(meta.generatedAt) : "",
      meta.commit ? "commit <code>" + esc(meta.commit) + "</code>" : "",
      meta.branch ? "branch <code>" + esc(meta.branch) + "</code>" : "",
    ].filter(Boolean);
    if (metaBits.length) html += "<p class='health-meta'>" + metaBits.join(" · ") + "</p>";
    html += "<div class='facet-grid'>";
    for (const f of facets) {
      const status = STATUSES.includes(f.status) ? f.status : "unknown";
      html += "<section class='facet facet-" + status + "'>";
      html += "<header><h2>" + esc(f.title) + "</h2>" +
        "<span class='pill pill-" + status + "'>" + status + "</span></header>";
      if (f.summary) html += "<p class='facet-summary'>" + esc(f.summary) + "</p>";
      if (Array.isArray(f.metrics) && f.metrics.length) {
        html += "<dl class='metrics'>";
        for (const m of f.metrics) {
          html += "<div><dt>" + esc(m.label) + "</dt><dd>" + esc(String(m.value)) + "</dd></div>";
        }
        html += "</dl>";
      }
      if (Array.isArray(f.items) && f.items.length) {
        html += "<details><summary>" + f.items.length + " findings</summary>" +
          "<ul class='findings'>";
        for (const item of f.items) {
          html += "<li class='sev-" + esc(item.severity || "info") + "'>" +
            "<code>" + esc(item.label) + "</code>" +
            (item.detail ? " — " + esc(item.detail) : "") + "</li>";
        }
        html += "</ul></details>";
      }
      html += "</section>";
    }
    html += "</div>";
    if (Array.isArray(meta.toolsUsed) && meta.toolsUsed.length) {
      html += "<p class='health-meta'>Data sources: " +
        meta.toolsUsed.map(esc).join(", ") + "</p>";
    }
    content.innerHTML = html;
  }

  async function render() {
    const section = currentSection();
    setActive(section.id);
    content.innerHTML = "<p class='loading'>Loading…</p>";
    try {
      const res = await fetch("data/" + section.file, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      if (section.type === "health") {
        renderHealth(await res.json());
      } else {
        await renderMarkdown(section, await res.text());
      }
    } catch (err) {
      content.innerHTML =
        "<p class='error'>Failed to load <code>data/" + esc(section.file) + "</code>: " +
        esc(err.message) + ".<br>If you opened index.html directly from disk, use " +
        "<code>open-handbook.bat</code> / <code>open-handbook.sh</code> instead — " +
        "browsers block fetch on file:// pages.</p>";
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();
})();
