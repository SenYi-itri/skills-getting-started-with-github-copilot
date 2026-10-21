document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("histogram-form");
  const input = document.getElementById("pixel-values");
  const error = document.getElementById("histogram-error");
  const preview = document.getElementById("pixel-canvas");
  const chart = document.getElementById("histogram-chart");
  const summary = document.getElementById("histogram-summary");

  function calculateHistogram(event) {
    if (event) event.preventDefault();
    const text = input.value.trim();
    const tokens = text ? text.split(/[\s,]+/) : [];
    if (
      tokens.length === 0 ||
      tokens.length > 65536 ||
      tokens.some((token) => !/^\d{1,3}$/.test(token) || Number(token) > 255)
    ) {
      error.textContent = "Enter 1–65,536 whole-number intensities between 0 and 255, separated by commas or whitespace.";
      error.classList.remove("hidden");
      input.setAttribute("aria-invalid", "true");
      return;
    }

    error.classList.add("hidden");
    input.removeAttribute("aria-invalid");
    const pixels = tokens.map(Number);
    const bins = new Array(256).fill(0);
    pixels.forEach((intensity) => bins[intensity]++);

    preview.width = Math.ceil(Math.sqrt(pixels.length));
    preview.height = Math.ceil(pixels.length / preview.width);
    const previewContext = preview.getContext("2d");
    const image = previewContext.createImageData(preview.width, preview.height);
    image.data.fill(255);
    pixels.forEach((intensity, index) => {
      const offset = index * 4;
      image.data[offset] = intensity;
      image.data[offset + 1] = intensity;
      image.data[offset + 2] = intensity;
    });
    previewContext.putImageData(image, 0, 0);

    const context = chart.getContext("2d");
    const left = 64;
    const top = 24;
    const width = chart.width - left - 20;
    const height = chart.height - top - 56;
    const maximum = Math.max(...bins);
    context.clearRect(0, 0, chart.width, chart.height);
    context.font = "14px Arial";
    context.fillStyle = "#333";
    context.textAlign = "right";
    const tickCount = Math.min(4, maximum);
    for (let tick = 0; tick <= tickCount; tick++) {
      const frequency = Math.round(maximum * tick / tickCount);
      const y = top + height - frequency / maximum * height;
      context.fillText(String(frequency), left - 8, y + 5);
      context.strokeStyle = "#ddd";
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(left + width, y);
      context.stroke();
    }
    context.fillStyle = "#1a237e";
    bins.forEach((frequency, intensity) => {
      const barHeight = frequency / maximum * height;
      context.fillRect(
        left + intensity * width / 256,
        top + height - barHeight,
        width / 256,
        barHeight
      );
    });
    context.fillStyle = "#333";
    context.textAlign = "center";
    [0, 64, 128, 192, 255].forEach((intensity) => {
      context.fillText(String(intensity), left + (intensity + 0.5) * width / 256, top + height + 20);
    });
    context.fillText("Pixel intensity (0–255)", left + width / 2, chart.height - 8);
    context.save();
    context.translate(16, top + height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText("Frequency (pixels)", 0, 0);
    context.restore();

    const mean = pixels.reduce((total, intensity) => total + intensity, 0) / pixels.length;
    summary.textContent = `${pixels.length} pixels · Mean intensity: ${mean.toFixed(2)} · Peak frequency: ${maximum}`;
    chart.setAttribute("aria-label", `Pixel-intensity histogram. ${summary.textContent}. Nonzero bins: ${
      bins.flatMap((frequency, intensity) => frequency ? [`${intensity}: ${frequency}`] : []).join(", ")
    }.`);
    preview.setAttribute("aria-label", `Grayscale preview of ${pixels.length} pixels.`);
  }

  form.addEventListener("submit", calculateHistogram);
  calculateHistogram();
});
