"use strict";

/**
 *
 * @param {string} substackUrl
 * @returns RSS feed XML from the given Substack URL.
 */
async function fetchSubstackRssFeed(substackUrl) {
  // Use a proxy to avoid CORS issues.
  const proxyUrl = new URL("https://corsproxy.io/?");
  proxyUrl.href += encodeURIComponent(substackUrl);

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

/**
 *
 * @param {string} postGuid
 */
async function displaySinglePostFromRssFeedByGuid(postGuid) {
  const substackUrl = "https://jamesjboyer.substack.com/feed";
  const substackSlugUrl = `https://jamesjboyer.substack.com/p/${postGuid}`;
  try {
    const feedXml = await fetchSubstackRssFeed(substackUrl);
    const feedElement = document.getElementById("substack-feed-single");

    // Parse the XML feed
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(feedXml, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    items.forEach((item) => {
      // Find the item with the given GUID -- this is the post we want.
      if (item.querySelector("guid").textContent == substackSlugUrl) {
        const title = item.querySelector("title").textContent;
        const description = item.querySelector("description").textContent;
        // Fetching the 'content:encoded' element.
        const contentEncoded = item.getElementsByTagNameNS("*", "encoded")[0];
        const content = contentEncoded ? contentEncoded.textContent : "";

        // Parse and format the publication date.
        const pubDate = item.querySelector("pubDate").textContent;
        const formattedDate = formatDate(pubDate);

        // Create the post to be rendered.
        const itemElement = document.createElement("article");
        itemElement.innerHTML = `
				<h2>${title}</h2>
				<p class="substack-post-date">${formattedDate}</p>
				<p class="substack-post-description">${description}</p>
				<p class="substack-post-content">${content}</p>
			`;

        // Set the title of the post page dynamically based on the post title.
        document.title = document.title.replace("{Post}", title);

        // Remove the last empty paragraph. Not sure why Substack sends this.
        const paragraphs = itemElement.querySelectorAll("p");
        if (paragraphs.length > 0) {
          const lastParagraph = paragraphs[paragraphs.length - 1];
          if (!lastParagraph.textContent.trim()) {
            lastParagraph.remove();
          }
        }

        // Append the post to the DOM.
        feedElement.appendChild(itemElement);
      }
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
  }
}

async function displayRssFeed() {
  const substackUrl = "https://jamesjboyer.substack.com/feed";
  try {
    const feedXml = await fetchSubstackRssFeed(substackUrl);
    const feedElement = document.getElementById("substack-feed");

    // Parse the XML feed
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(feedXml, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    items.forEach((item) => {
      const guid = item.querySelector("guid").textContent.split("/p/")[1];

      const title = item.querySelector("title").textContent;
      const description = item.querySelector("description").textContent;

      // Parse and format the publication date
      const pubDate = item.querySelector("pubDate").textContent;
      const formattedDate = formatDate(pubDate);

      // Create the element
      const itemElement = document.createElement("article");
      itemElement.innerHTML = `
		<h2><a href="post.html?id=${guid}">${title}</a></h2>
		<p class="substack-post-date">${formattedDate}</p>
		<p class="substack-post-description">${description}</p>
	`;

      // Append the post snippet to the DOM.
      feedElement.appendChild(itemElement);
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
  }
}

function unlinkSubstackImages() {
  const pictures = document.querySelectorAll(
    ".captioned-image-container picture"
  );

  pictures.forEach((picture) => {
    const figure = picture.closest("figure");
    const container = figure
      ? figure.closest(".captioned-image-container")
      : null;

    if (container) {
      // Replace the container with just the picture element. We don't want to link out to Substack.
      container.parentNode.replaceChild(picture, container);
    }
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPostGuid() {
  const urlParams = new URLSearchParams(window.location.search);
  const postGuid = urlParams.get("id");

  if (postGuid) {
    // Split the URL by '/p/' and get just the slug.
    const parts = postGuid.split("/p/");
    if (parts.length > 1) {
      return parts[1];
    }
  }

  return postGuid;
}
