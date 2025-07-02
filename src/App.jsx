import React, { useEffect, useRef, useState } from "react";
import techkillaLogo from "./assets/techkilla-logo.jpg";

const App = () => {
  const canvasRef = useRef(null);
  const mainImageRef = useRef(null);
  const [gridColors, setGridColors] = useState([]);
  const gridCols = 40;
  const gridRows = 25;
  let cellWidth = 0;
  let cellHeight = 0;

  // const mainImageSrc =
  //   "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  useEffect(() => {
    const mainImage = mainImageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    mainImage.onload = () => {
      canvas.width = mainImage.width;
      canvas.height = mainImage.height;

      cellWidth = canvas.width / gridCols;
      cellHeight = canvas.height / gridRows;

      // ❌ Don't draw full image
      // ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height);

      const newGridColors = [];

      // Temporarily draw main image off-screen for pixel data
      ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height);

      for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
          const sx = Math.floor(x * cellWidth);
          const sy = Math.floor(y * cellHeight);
          const imgData = ctx.getImageData(
            sx,
            sy,
            Math.floor(cellWidth),
            Math.floor(cellHeight)
          ).data;

          let r = 0,
            g = 0,
            b = 0,
            count = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            r += imgData[i];
            g += imgData[i + 1];
            b += imgData[i + 2];
            count++;
          }

          newGridColors.push({
            x,
            y,
            r: Math.floor(r / count),
            g: Math.floor(g / count),
            b: Math.floor(b / count),
            used: false,
          });
        }
      }

      // Clear the canvas (remove temporary draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setGridColors(newGridColors);
    };
  }, []);

  const getAverageColor = (img) => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, img.width, img.height).data;
    let r = 0,
      g = 0,
      b = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      r += imgData[i];
      g += imgData[i + 1];
      b += imgData[i + 2];
    }

    const count = imgData.length / 4;
    return {
      r: Math.floor(r / count),
      g: Math.floor(g / count),
      b: Math.floor(b / count),
    };
  };

  const findNearestColor = (avgColor) => {
    let minDist = Infinity;
    let bestMatch = null;
    const updatedGrid = [...gridColors];

    for (const cell of updatedGrid) {
      if (cell.used) continue;

      const dist = Math.sqrt(
        Math.pow(avgColor.r - cell.r, 2) +
          Math.pow(avgColor.g - cell.g, 2) +
          Math.pow(avgColor.b - cell.b, 2)
      );

      if (dist < minDist) {
        minDist = dist;
        bestMatch = cell;
      }
    }

    if (bestMatch) {
      bestMatch.used = true;
      setGridColors(updatedGrid);
    }

    return bestMatch;
  };

  const handleUpload = (e) => {
    const files = e.target.files;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    Array.from(files).forEach((file) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const avgColor = getAverageColor(img);
        const targetCell = findNearestColor(avgColor);

        if (targetCell) {
          cellWidth = canvas.width / gridCols;
          cellHeight = canvas.height / gridRows;

          // ✅ 1. Draw the matching patch from main image (light background)
          ctx.drawImage(
            mainImageRef.current,
            targetCell.x * cellWidth,
            targetCell.y * cellHeight,
            cellWidth,
            cellHeight,
            targetCell.x * cellWidth,
            targetCell.y * cellHeight,
            cellWidth,
            cellHeight
          );

          // ✅ 2. Draw the uploaded small image on top
          ctx.save();
          ctx.globalAlpha = 0.6; // Optional: Slight transparency
          ctx.drawImage(
            img,
            targetCell.x * cellWidth,
            targetCell.y * cellHeight,
            cellWidth,
            cellHeight
          );
          ctx.restore();
        }
      };
      img.src = URL.createObjectURL(file);
    });

    e.target.value = null;
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial" }}>
      <h2>Mosaic Image with Small Overlays</h2>

      <img
        ref={mainImageRef}
        src={techkillaLogo}
        alt="Main Mosaic"
        style={{ display: "none" }}
        crossOrigin="anonymous"
      />

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: "1px solid #333", marginTop: "10px" }}
      ></canvas>

      <br />
      <br />

      <input type="file" multiple accept="image/*" onChange={handleUpload} />
      <p>
        Upload images-if they match a part of the main image color, that part
        will be revealed with your small image on top.
      </p>
    </div>
  );
};

export default App;
