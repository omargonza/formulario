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

    html2canvas(formulario, { useCORS: true, scale: 2 }).then((canvas) => {
      const pdf = new jsPDF({
        unit: "mm", // Medida en milímetros
        format: "a4", // Formato A4
        orientation: "portrait" // Orientación vertical
      });

      // Ajustamos el tamaño del canvas al tamaño A4
      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Generamos la imagen
      const pageHeight = pdf.internal.pageSize.height; // Altura de la página A4
      const pageWidth = pdf.internal.pageSize.width; // Ancho de la página A4

      // Definimos el tamaño y la posición de la imagen
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * (imgWidth / canvas.width); // Mantener proporciones
      const yOffset = (pageHeight - imgHeight) / 2; // Centrado verticalmente

      pdf.addImage(imgData, "JPEG", 0, yOffset, imgWidth, imgHeight);
      pdf.save(nombreArchivo);
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
      // 📸 Usar cámara trasera
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      video.srcObject = stream;
      video.style.display = "block";
      capturarBtn.style.display = "inline-block";
      grabarBtn.style.display = "inline-block";
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
    grabarBtn.style.display = "none"; // <-- y esta
    detenerBtn.style.display = "none"; // <-- también
    descargarLink.style.display = "none"; // <-- oculta el enlace
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
let mediaRecorder;
let grabaciones = [];

const grabarBtn = document.getElementById("grabarVideoBtn");
const detenerBtn = document.getElementById("detenerGrabacionBtn");
const descargarLink = document.getElementById("descargarVideoLink");

grabarBtn.addEventListener("click", () => {
  if (stream) {
    grabaciones = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        grabaciones.push(e.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(grabaciones, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      descargarLink.href = url;
      descargarLink.style.display = "inline-block";
    };
    mediaRecorder.start();
    grabarBtn.style.display = "none";
    detenerBtn.style.display = "inline-block";
  }
});

detenerBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    grabarBtn.style.display = "inline-block";
    detenerBtn.style.display = "none";
  }
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

    
