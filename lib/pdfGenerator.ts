import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateOfferPDF = async (fileName: string = "Offer_Letter.pdf") => {

  const previewContainer = document.getElementById("offer-letter");

  if (!previewContainer) {
    throw new Error("Preview container not found");
  }

  // Remove scaling temporarily
  const originalTransform = previewContainer.style.transform;
  previewContainer.style.transform = "scale(1)";

  const pages = previewContainer.querySelectorAll(".a4-page");

  if (!pages.length) {
    throw new Error("No pages found for PDF");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  for (let i = 0; i < pages.length; i++) {

    const page = pages[i] as HTMLElement;

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      allowTaint: false,
      logging: false
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.9);

    if (i > 0) pdf.addPage();

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST"
    );
  }

  // Restore preview scale
  previewContainer.style.transform = originalTransform;

  pdf.save(fileName);
};