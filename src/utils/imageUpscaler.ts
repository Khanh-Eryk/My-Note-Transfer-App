/**
 * Upscale image to 2K resolution (target width ~2560px or height ~1440px)
 * using multi-pass Canvas interpolation and unsharp mask sharpening.
 */
export async function upscaleImageTo2K(
  imageSource: string | HTMLImageElement,
  targetWidth = 2560
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width
        const originalHeight = img.naturalHeight || img.height

        // Calculate aspect ratio
        const scaleFactor = Math.max(1, targetWidth / originalWidth)
        if (scaleFactor <= 1 && originalWidth >= 2000) {
          // Already high resolution
          resolve(typeof imageSource === 'string' ? imageSource : img.src)
          return
        }

        const newWidth = Math.round(originalWidth * scaleFactor)
        const newHeight = Math.round(originalHeight * scaleFactor)

        // Step-wise upscaling for smoother bicubic-like interpolation
        let curCanvas = document.createElement('canvas')
        let curCtx = curCanvas.getContext('2d')
        if (!curCtx) {
          reject(new Error('Cannot create canvas context'))
          return
        }

        curCanvas.width = originalWidth
        curCanvas.height = originalHeight
        curCtx.drawImage(img, 0, 0)

        // Incremental upscale by 1.5x steps to avoid blockiness
        let w = originalWidth
        let h = originalHeight

        while (w * 1.5 < newWidth) {
          const nextW = Math.round(w * 1.5)
          const nextH = Math.round(h * 1.5)

          const nextCanvas = document.createElement('canvas')
          nextCanvas.width = nextW
          nextCanvas.height = nextH
          const nextCtx = nextCanvas.getContext('2d')
          if (!nextCtx) break

          nextCtx.imageSmoothingEnabled = true
          nextCtx.imageSmoothingQuality = 'high'
          nextCtx.drawImage(curCanvas, 0, 0, w, h, 0, 0, nextW, nextH)

          curCanvas = nextCanvas
          curCtx = nextCtx
          w = nextW
          h = nextH
        }

        // Final step to exact target 2K dimensions
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = newWidth
        finalCanvas.height = newHeight
        const finalCtx = finalCanvas.getContext('2d')
        if (!finalCtx) {
          reject(new Error('Cannot create final canvas context'))
          return
        }

        finalCtx.imageSmoothingEnabled = true
        finalCtx.imageSmoothingQuality = 'high'
        finalCtx.drawImage(curCanvas, 0, 0, w, h, 0, 0, newWidth, newHeight)

        // Apply unsharp mask to enhance details and contrast
        applyUnsharpMask(finalCtx, newWidth, newHeight, 0.35)

        // Return high quality PNG / JPEG
        const highResDataUrl = finalCanvas.toDataURL('image/jpeg', 0.95)
        resolve(highResDataUrl)
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = (e) => reject(e)

    if (typeof imageSource === 'string') {
      img.src = imageSource
    } else {
      img.src = imageSource.src
    }
  })
}

/**
 * Apply subtle unsharp masking filter via canvas ImageData
 */
function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data
    const buff = new Uint8ClampedArray(data)

    // Quick 3x3 convolution laplacian matrix
    // [ 0, -1,  0 ]
    // [-1,  5, -1 ]
    // [ 0, -1,  0 ]
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        for (let c = 0; c < 3; c++) {
          const center = buff[idx + c]
          const top = buff[((y - 1) * width + x) * 4 + c]
          const bottom = buff[((y + 1) * width + x) * 4 + c]
          const left = buff[(y * width + (x - 1)) * 4 + c]
          const right = buff[(y * width + (x + 1)) * 4 + c]

          const laplacian = 5 * center - (top + bottom + left + right)
          // Blend sharpened with original based on amount
          data[idx + c] = Math.min(255, Math.max(0, center + (laplacian - center) * amount))
        }
      }
    }

    ctx.putImageData(imgData, 0, 0)
  } catch {
    // If browser security blocks getImageData (e.g. tainted canvas), quietly fail
  }
}

