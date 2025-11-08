import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Add Chinese font support
const addChineseFontSupport = (pdf: jsPDF) => {
  // For production, you should load a proper Chinese font file
  // This is a workaround using canvas for Chinese text
  return pdf;
};

export const generatePDF = async (itinerary: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Set document properties
  pdf.setProperties({
    title: `${itinerary.metadata?.destination || '旅行'} - 行程计划`,
    subject: 'AI生成的旅行计划',
    author: 'AI Travel Planner',
    keywords: 'travel, itinerary, AI',
    creator: 'AI Travel Planner'
  });

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with Chinese support
  const addText = (text: string, x: number, y: number, options?: any) => {
    try {
      pdf.text(text, x, y, options);
    } catch (e) {
      // Fallback for Chinese characters
      pdf.text(text.replace(/[^\x00-\x7F]/g, '?'), x, y, options);
    }
  };

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(34, 197, 94); // Primary green color
  addText(itinerary.metadata?.destination || 'Travel Plan', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // Trip details
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);

  const details = [
    `Date: ${itinerary.metadata?.start_date} to ${itinerary.metadata?.end_date}`,
    `Duration: ${itinerary.metadata?.total_days} days`,
    `Budget: ¥${itinerary.metadata?.budget}`,
    `Travelers: ${itinerary.metadata?.people_count} people`
  ];

  details.forEach(detail => {
    addText(detail, margin, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Summary
  if (itinerary.summary) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 197, 94);
    addText('Trip Highlights', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const summaryLines = pdf.splitTextToSize(itinerary.summary, pageWidth - 2 * margin);
    summaryLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      addText(line, margin, yPosition);
      yPosition += 6;
    });
  }

  yPosition += 10;

  // Budget breakdown
  if (itinerary.budget_breakdown) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 197, 94);
    addText('Budget Breakdown', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    Object.entries(itinerary.budget_breakdown).forEach(([category, amount]) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      addText(`${categoryName}: ¥${amount}`, margin + 5, yPosition);
      yPosition += 6;
    });
  }

  yPosition += 10;

  // Daily itinerary
  if (itinerary.daily_itinerary) {
    itinerary.daily_itinerary.forEach((day: any) => {
      // Check if need new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      // Day header
      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      addText(`Day ${day.day}: ${day.theme || ''}`, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      addText(day.date || '', margin, yPosition);
      yPosition += 10;

      // Day items
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      day.items?.forEach((item: any) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        // Time and title
        pdf.setFont(undefined, 'bold');
        addText(`${item.time} - ${item.title}`, margin + 5, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 6;

        // Description
        const descLines = pdf.splitTextToSize(item.description || '', pageWidth - 2 * margin - 10);
        descLines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          addText(line, margin + 10, yPosition);
          yPosition += 5;
        });

        // Location and cost
        if (item.location) {
          pdf.setTextColor(100, 100, 100);
          addText(`Location: ${item.location}`, margin + 10, yPosition);
          yPosition += 5;
        }

        if (item.estimated_cost > 0) {
          addText(`Cost: ¥${item.estimated_cost}`, margin + 10, yPosition);
          yPosition += 5;
        }

        pdf.setTextColor(0, 0, 0);
        yPosition += 5;
      });

      yPosition += 10;
    });
  }

  // Travel tips
  if (itinerary.travel_tips && itinerary.travel_tips.length > 0) {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(34, 197, 94);
    addText('Travel Tips', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    itinerary.travel_tips.forEach((tip: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      const tipLines = pdf.splitTextToSize(`• ${tip}`, pageWidth - 2 * margin);
      tipLines.forEach((line: string) => {
        addText(line, margin + 5, yPosition);
        yPosition += 6;
      });
    });
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addText(
      `Generated by AI Travel Planner - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return pdf;
};

// 使用HTML转PDF的方法，更好地支持中文
export const generatePDFFromHTML = async (elementId: string, filename: string = 'itinerary.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('未找到要导出的元素');
    return;
  }

  // 创建HTML的canvas截图
  const canvas = await html2canvas(element, {
    scale: 2, // 提高清晰度
    useCORS: true, // 允许跨域图片
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    // 优化中文字体渲染
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        // 确保所有文字都可见
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.overflow = 'visible';
      }
    }
  });

  // 计算PDF尺寸
  const imgWidth = 210; // A4宽度（mm）
  const pageHeight = 297; // A4高度（mm）
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  // 创建PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  let position = 0;

  // 将canvas转换为图片
  const imgData = canvas.toDataURL('image/png', 1.0); // 使用PNG格式保证质量

  // 添加第一页
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // 如果内容超过一页，添加新页
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // 保存PDF
  pdf.save(filename);
};

export const pdfService = {
  generatePDF,
  generatePDFFromHTML
};