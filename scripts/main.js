document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // GENERACIÓN DE PDF
  // =========================
  window.generarPDF = function () {
    const formulario = document.getElementById("formulario");
    if (!formulario) {
      alert("Formulario no encontrado.");
      return;
    }

    // Validar campos obligatorios (excepto materiales)
    const inputs = formulario.querySelectorAll("input, textarea, select");
    try {
      for (const input of inputs) {
        const esMaterial = input.closest("table")?.id === "tablaMateriales";
        if (!esMaterial && input.type !== "file" && input.value.trim() === "") {
          const label = formulario.querySelector(`label[for="${input.id}"]`);
          const nombreCampo = label?.textContent || input.placeholder || "Campo obligatorio";
          alert(`Por favor, completa el campo: ${nombreCampo}`);
          throw new Error(`Campo vacío: ${nombreCampo}`);
        }
      }
    } catch (err) {
      console.warn(err.message);
      return;
    }

    const nombreArchivo = `${document.querySelector('input[name="tablero"]').value || "parte"}_mantenimiento.pdf`;

    html2canvas(formulario, { 
      useCORS: true, 
      scale: 3, 
      logging: true, 
    }).then((canvas) => {
      // Generar PDF con las opciones adecuadas
      html2pdf()
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],  // Margen ajustado
          filename: nombreArchivo,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .from(canvas)
        .save();
    }).catch((error) => {
      console.error("Error al generar el PDF:", error);
      alert("Ocurrió un error al generar el PDF.");
    });
  };

  // =========================
  // CÁMARA Y SUBIDA DE IMÁGENES
  // =========================
  let camaraActiva = false;
  let stream;
  
  const toggleBtn = document.getElementById("toggleCamaraBtn");
  const video = document.getElementById("video");
  const capturarBtn = document.getElementById("capturarFotoBtn");
  const imagenCapturada = document.getElementById("imagenCapturada");
  const uploadImg = document.getElementById("uploadImg");
  
  toggleBtn.addEventListener("click", async () => {
    if (!camaraActiva) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = "block";
        capturarBtn.style.display = "inline-block";
        toggleBtn.textContent = "Apagar Cámara";
        camaraActiva = true;
      } catch (err) {
        alert("No se pudo acceder a la cámara.");
        console.error(err);
      }
    } else {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      video.style.display = "none";
      capturarBtn.style.display = "none";
      toggleBtn.textContent = "Encender Cámara";
      camaraActiva = false;
    }
  });
  
  capturarBtn.addEventListener("click", () => {
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = video.videoWidth;
    canvasTemp.height = video.videoHeight;
    const context = canvasTemp.getContext("2d");
    context.drawImage(video, 0, 0, canvasTemp.width, canvasTemp.height);
    imagenCapturada.src = canvasTemp.toDataURL("image/png");
    imagenCapturada.style.display = "block";
  });
  
  uploadImg.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      imagenCapturada.src = e.target.result;
      imagenCapturada.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // =========================
  // BOTÓN DE AGREGAR MATERIALES
  // =========================
  window.agregarFila = function () {
    const tabla = document.querySelector("#tablaMateriales tbody");
    if (!tabla) {
      console.error("Tabla de materiales no encontrada.");
      return;
    }

    const nuevaFila = document.createElement("tr");
    nuevaFila.innerHTML = `
      <td><input type="text" name="material[]" placeholder="Nombre del material" /></td>
      <td><input type="number" name="cantidad[]" placeholder="Cantidad" /></td>
      <td><input type="text" name="unidad[]" placeholder="Unidad" /></td>
      <td><button type="button" onclick="eliminarFila(this)">Eliminar</button></td>
    `;
    tabla.appendChild(nuevaFila);
  };

  window.eliminarFila = function (boton) {
    const fila = boton.closest("tr");
    fila.remove();
  };
});

    
