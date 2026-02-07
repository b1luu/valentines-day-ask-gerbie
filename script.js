const qrGrid = document.querySelector(".qr-grid");
const qrCanvas = document.getElementById("qr-canvas");
const qrNote = document.getElementById("qr-note");
const qrLinkInput = document.getElementById("qr-link");

const GRID_SIZE = 25;

const hashString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
};

const seededRandom = (seed) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const isFinder = (x, y, offsetX, offsetY) => {
  const dx = x - offsetX;
  const dy = y - offsetY;
  if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
  const onBorder = dx === 0 || dy === 0 || dx === 6 || dy === 6;
  const inCenter = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
  return onBorder || inCenter;
};

const isTiming = (x, y) => (x === 6 && y > 7 && y < GRID_SIZE - 8) || (y === 6 && x > 7 && x < GRID_SIZE - 8);

const buildPlaceholderGrid = (seedValue) => {
  if (!qrGrid) return;

  qrGrid.innerHTML = "";
  const random = seededRandom(seedValue);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = document.createElement("span");
      cell.className = "qr-cell";

      const inFinder =
        isFinder(x, y, 0, 0) ||
        isFinder(x, y, GRID_SIZE - 7, 0) ||
        isFinder(x, y, 0, GRID_SIZE - 7);

      if (inFinder || isTiming(x, y) || random() > 0.65) {
        cell.classList.add("dark");
      }

      qrGrid.appendChild(cell);
    }
  }
};

const getDefaultLink = () => {
  if (window.location.protocol === "file:") {
    return "https://your-invite-link/ask.html";
  }
  const basePath = window.location.pathname.replace(/[^/]*$/, "");
  return `${window.location.origin}${basePath}ask.html`;
};

const renderRealQr = async (link) => {
  if (!window.QRCode || !qrCanvas) return false;
  try {
    await QRCode.toCanvas(qrCanvas, link, {
      width: qrCanvas.width || 220,
      margin: 1,
      color: {
        dark: "#1f0b12",
        light: "#ffffff",
      },
    });
    qrCanvas.style.display = "block";
    if (qrGrid) qrGrid.style.display = "none";
    if (qrNote) qrNote.textContent = "QR generated from your link. Change the link to refresh.";
    return true;
  } catch (error) {
    return false;
  }
};

const updateQr = async () => {
  if (!qrLinkInput) return;

  const fallbackLink = qrLinkInput.dataset.defaultLink || getDefaultLink();
  const link = qrLinkInput.value.trim() || fallbackLink;
  const seedValue = hashString(link || "valentine");

  buildPlaceholderGrid(seedValue);
  const rendered = await renderRealQr(link);

  if (!rendered && qrNote) {
    if (window.location.protocol === "file:") {
      qrNote.textContent = "Local file detected. Paste a public link to share the surprise.";
    } else {
      qrNote.textContent = "Placeholder pattern is showing. Add a QR library or swap in your own QR image.";
    }
  }
};

const initQr = () => {
  if (!qrLinkInput) return;

  const defaultLink = getDefaultLink();
  qrLinkInput.dataset.defaultLink = defaultLink;
  if (!qrLinkInput.value) {
    qrLinkInput.value = defaultLink;
  }

  qrLinkInput.addEventListener("input", () => {
    updateQr();
  });

  updateQr();
};

initQr();
