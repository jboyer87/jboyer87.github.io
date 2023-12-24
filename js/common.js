"use strict";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("year").textContent = new Date().getFullYear();

  window.onload = function () {
    document.body.classList.add("loaded");
  };
});
