"use strict";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("year").textContent = new Date().getFullYear();
});

window.addEventListener("load", function () {
  document.body.classList.add("loaded");
});
