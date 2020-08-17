const previewArea = document.querySelector(".post-editor__preview-area");
const textarea = document.querySelector(".post-editor__textarea");

const updatePreviewArea = () => {
  previewArea.innerHTML = marked(textarea.value);
};

window.onload = () => {
  textarea.addEventListener("input", updatePreviewArea);
  updatePreviewArea();
};
