"use strict";

// Include Feather Icons
document.addEventListener("DOMContentLoaded", function () {
  if (typeof feather !== "undefined") {
    feather.replace();
  }
});

/**
 * Fetches the RSS feed from a given Substack URL using a proxy to avoid CORS issues.
 * @param {string} substackUrl - The URL of the Substack RSS feed.
 * @returns {Promise<string>} - The fetched RSS feed data as text.
 */
async function fetchSubstackRssFeed(substackUrl) {
  const proxyUrl = new URL("https://corsproxy.io/?");
  proxyUrl.href += encodeURIComponent(substackUrl);

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    displayErrorMessage(`Error fetching RSS feed: ${error.message}`);
    throw error; // Re-throw for caller to handle if needed
  }
}

/**
 * Parses the RSS feed XML and returns an array of feed items.
 * @param {string} feedXml - The RSS feed XML as text.
 * @returns {Array} - An array of parsed feed items.
 */
function parseRssFeed(feedXml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(feedXml, "text/xml");
  const items = xmlDoc.querySelectorAll("item");

  return Array.from(items).map((item) => {
    return {
      guid: item.querySelector("guid").textContent,
      title: item.querySelector("title").textContent,
      description: item.querySelector("description").textContent,
      pubDate: item.querySelector("pubDate").textContent,
      content:
        item.getElementsByTagNameNS("*", "encoded")[0]?.textContent || "",
    };
  });
}

/**
 * Creates an HTML element for a feed item, with options to include link and content.
 * @param {Object} feedItem - The feed item object.
 * @param {boolean} includeLink - Whether to include a link in the post title.
 * @param {boolean} includeContent - Whether to include the post content.
 * @returns {HTMLElement} - The created HTML element for the feed item.
 */
function createFeedItemElement(
  feedItem,
  includeLink = true,
  includeContent = false
) {
  const itemElement = document.createElement("article");
  const formattedDate = formatDate(feedItem.pubDate);
  const postSlug = extractSlugFromGuid(feedItem.guid);

  itemElement.innerHTML = `
        <h2>${
          includeLink
            ? `<a href="post.html?id=${postSlug}">${feedItem.title}</a>`
            : feedItem.title
        }</h2>
        <p class="substack-post-date">${formattedDate}</p>
        <p class="substack-post-description">${feedItem.description}</p>
        ${
          includeContent
            ? `<div class="substack-post-content">${feedItem.content}</div>`
            : ""
        }
    `;

  return itemElement;
}

/**
 * Formats a date string into a more readable format.
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted date string.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Displays an error message in a designated alert element.
 * @param {string} message - The error message to display.
 */
function displayErrorMessage(message) {
  const alertElement = document.getElementById("alerts");
  alertElement.innerHTML = `<div class="alert-error"><i data-feather="alert-circle"></i> ${message}</div>`;
  alertElement.style.display = "block";

  // Ensure Feather icons are replaced after updating the DOM
  if (typeof feather !== "undefined") {
    setTimeout(() => feather.replace(), 0);
  }
}

/**
 * Extracts the slug part from a Substack post GUID.
 * @param {string} guid - The GUID of the post.
 * @returns {string} - The extracted slug.
 */
function extractSlugFromGuid(guid) {
  const parts = guid.split("/");
  return parts[parts.length - 1]; // Assuming the slug is the last part of the URL
}

async function displayRssFeed() {
  const substackUrl = "https://jamesjboyer.substack.com/feed";
  try {
    const feedXml = await fetchSubstackRssFeed(substackUrl);
    const feedItems = parseRssFeed(feedXml);
    const feedElement = document.getElementById("substack-feed");

    feedElement.innerHTML = "";
    feedItems.forEach((feedItem) => {
      const itemElement = createFeedItemElement(feedItem, true, false);
      feedElement.appendChild(itemElement);
    });
  } catch (error) {
    console.error("Error displaying RSS feed:", error);
    displayErrorMessage("Failed to load the RSS feed. Please try again later.");
  }
}

/**
 * Displays a single post from the RSS feed by its slug.
 * @param {string} postSlug - The slug of the post to display.
 */
async function displaySinglePostFromRssFeedBySlug(postSlug) {
  const substackUrl = "https://jamesjboyer.substack.com/feed";
  try {
    const feedXml = await fetchSubstackRssFeed(substackUrl);
    const feedItems = parseRssFeed(feedXml);
    const feedElement = document.getElementById("substack-feed-single");

    const matchedItem = feedItems.find(
      (item) => extractSlugFromGuid(item.guid) === postSlug
    );
    if (matchedItem) {
      const itemElement = createFeedItemElement(matchedItem, false, true);
      document.title = document.title.replace("{Post}", matchedItem.title);
      feedElement.innerHTML = "";
      feedElement.appendChild(itemElement);
      unlinkSubstackImages();
    } else {
      displayErrorMessage("The requested post could not be found.");
    }
  } catch (error) {
    console.error("Error displaying specific RSS feed post:", error);
    displayErrorMessage(
      "Failed to load the specific post. Please try again later."
    );
  }
}

/**
 * Unlinks Substack images from the CDN.
 * This function finds images that are linked to Substack's CDN and removes the links,
 * leaving only the image elements.
 */
function unlinkSubstackImages() {
  const linkedImages = document.querySelectorAll(
    "a[href*='substackcdn.com'] img"
  );

  linkedImages.forEach((img) => {
    const parentLink = img.closest("a");

    if (parentLink) {
      // Replace the link with just the image element
      parentLink.parentNode.replaceChild(img.cloneNode(true), parentLink);
    }
  });
}

/**
 * Extracts the post slug from the URL query parameters.
 * @returns {string|null} - The post slug or null if not found.
 */
function getPostSlug() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}
