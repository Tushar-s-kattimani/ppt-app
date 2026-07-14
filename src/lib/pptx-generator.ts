import pptxgen from "pptxgenjs";

export type ThemeType = 'corporate-blue' | 'dark-modern' | 'clean-light' | 'nature-green' | 'sunset-orange' | 'elegant-monochrome' | 'neon-cyberpunk' | 'vintage-sepia' | 'ocean-breeze' | 'royal-purple' | 'cherry-blossom' | 'minimal-bold';

export interface SlideData {
  title: string;
  subtitle?: string;
  content: string[];
  speakerNotes?: string;
  imageKeyword?: string;
  imageUrl?: string;
  imageData?: string; // base64 string
}

const THEME_PALETTES = {
  'corporate-blue': {
    bg: 'F0F4F8',        // soft blue-gray bg
    titleBg: '1E3A8A',   // dark blue title slide bg
    titleText: 'FFFFFF', // white title text
    text: '334155',      // slate text
    accent: '3B82F6',    // bright blue accent
    bullet: '2563EB',    // strong blue bullet
  },
  'dark-modern': {
    bg: '0F172A',        // slate-900 bg
    titleBg: '020617',   // slate-950 title bg
    titleText: 'F8FAFC', // light text
    text: 'CBD5E1',      // slate-300 text
    accent: '8B5CF6',    // violet accent
    bullet: 'A78BFA',    // light violet bullet
  },
  'clean-light': {
    bg: 'FFFFFF',        // pure white
    titleBg: 'F8FAFC',   // very light slate bg
    titleText: '0F172A', // dark text
    text: '475569',      // slate-600 text
    accent: '10B981',    // emerald accent
    bullet: '059669',    // emerald bullet
  },
  'nature-green': {
    bg: 'F0FDF4',        // green-50
    titleBg: '14532D',   // green-900
    titleText: 'FFFFFF', // white
    text: '166534',      // green-800
    accent: '22C55E',    // green-500
    bullet: '15803D',    // green-700
  },
  'sunset-orange': {
    bg: 'FFF7ED',        // orange-50
    titleBg: 'C2410C',   // orange-700
    titleText: 'FFFFFF', // white
    text: '9A3412',      // orange-800
    accent: 'F97316',    // orange-500
    bullet: 'EA580C',    // orange-600
  },
  'elegant-monochrome': {
    bg: 'FAFAFA',        // zinc-50
    titleBg: '18181B',   // zinc-900
    titleText: 'FFFFFF', // white
    text: '27272A',      // zinc-800
    accent: '52525B',    // zinc-500
    bullet: '3F3F46',    // zinc-700
  },
  'neon-cyberpunk': {
    bg: '000000',
    titleBg: '111111',
    titleText: 'EC4899', // neon pink
    text: 'E2E8F0',
    accent: '06B6D4',    // cyan
    bullet: '8B5CF6',    // purple
  },
  'vintage-sepia': {
    bg: 'FDF6E3',
    titleBg: 'D4B483',
    titleText: '4A3F35',
    text: '5C4B51',
    accent: '8C5A48',
    bullet: 'C17961',
  },
  'ocean-breeze': {
    bg: 'F0FDFA',
    titleBg: '0F766E',
    titleText: 'FFFFFF',
    text: '115E59',
    accent: '0EA5E9',
    bullet: '0284C7',
  },
  'royal-purple': {
    bg: 'FAF5FF',
    titleBg: '581C87',
    titleText: 'F3E8FF',
    text: '4C1D95',
    accent: 'D97706',
    bullet: 'B45309',
  },
  'cherry-blossom': {
    bg: 'FFF1F2',
    titleBg: 'F43F5E',
    titleText: 'FFFFFF',
    text: '881337',
    accent: 'FB7185',
    bullet: 'E11D48',
  },
  'minimal-bold': {
    bg: 'FEF08A',
    titleBg: '000000',
    titleText: 'FEF08A',
    text: '000000',
    accent: 'DC2626',
    bullet: '000000',
  }
};

export async function generatePptx(topic: string, slides: SlideData[], theme: ThemeType = 'corporate-blue') {
  const pres = new pptxgen();
  const palette = THEME_PALETTES[theme] || THEME_PALETTES['corporate-blue'];

  // Safely truncate the topic for metadata to prevent PowerPoint XML corruption (max 255 chars)
  const safeTopic = topic.length > 100 ? topic.substring(0, 100) + "..." : topic;

  // Set presentation properties
  pres.author = "SlideCraft AI";
  pres.company = "SlideCraft AI";
  pres.title = `Presentation on ${safeTopic}`;
  pres.layout = "LAYOUT_16x9"; // 10 inches wide, 5.625 inches high

  // Master Slide Definition for a highly attractive, modern design
  pres.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: palette.bg },
    objects: [
      // Top accent bar
      { rect: { x: 0, y: 0, w: 10.0, h: 0.15, fill: { color: palette.accent } } },
      // Footer bar
      { rect: { x: 0, y: 5.2, w: 10.0, h: 0.425, fill: { color: palette.titleBg } } },
    ],
    slideNumber: { x: 9.0, y: 5.25, w: 0.5, h: 0.3, fontSize: 10, color: "FFFFFF", fontFace: "Calibri", align: "right" },
  });

  // Master Title Slide Definition
  pres.defineSlideMaster({
    title: "TITLE_SLIDE",
    background: { color: palette.titleBg },
    objects: [
      { rect: { x: 0, y: 2.25, w: 10.0, h: 1.125, fill: { color: palette.accent } } }, 
    ],
  });

  // Generate each slide
  slides.forEach((slideData, index) => {
    // Treat the first slide as a Title Slide
    const isTitleSlide = index === 0;
    const slide = pres.addSlide({ masterName: isTitleSlide ? "TITLE_SLIDE" : "MASTER_SLIDE" });

    if (isTitleSlide) {
      // Title Slide Layout
      slide.addText(slideData.title, {
        x: 0.5,
        y: 1.8,
        w: 9.0,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: palette.titleText,
        align: "center",
        fontFace: "Calibri",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 3.1,
          w: 9.0,
          h: 0.8,
          fontSize: 24,
          color: palette.titleBg === 'F8FAFC' ? '475569' : 'E2E8F0',
          align: "center",
          italic: true,
          fontFace: "Calibri",
        });
      }
    } else {
      // Content Slide Layout
      const hasImage = !!(slideData.imageUrl || slideData.imageData);
      const contentWidth = hasImage ? 4.5 : 9.0;
      const contentX = 0.5;
      
      // Slide Title
      slide.addText(slideData.title, {
        x: contentX,
        y: 0.4,
        w: 9.0,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: palette.titleBg === 'F8FAFC' ? '0F172A' : (palette.bg === '0F172A' ? 'FFFFFF' : '1E293B'),
        fontFace: "Calibri",
      });

      // Accent line under title
      slide.addShape(pres.ShapeType.rect, {
        x: contentX, y: 1.1, w: 1.5, h: 0.05, fill: { color: palette.accent }
      });

      let contentStartY = 1.3;

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: contentX,
          y: contentStartY,
          w: contentWidth,
          h: 0.4,
          fontSize: 18,
          color: palette.text,
          italic: true,
          fontFace: "Calibri",
        });
        contentStartY += 0.5; // push bullets down slightly
      }

      // Bullet points
      if (slideData.content && slideData.content.length > 0) {
        const flatTextProps: any[] = [];
        
        slideData.content.forEach((point, i) => {
          const colonIndex = point.indexOf(":");
          const hasBoldPrefix = colonIndex > 0 && colonIndex < 40;
          const isFirstBullet = i === 0;
          
          if (hasBoldPrefix) {
            flatTextProps.push({
              text: point.substring(0, colonIndex + 1),
              options: { 
                bold: true, 
                color: palette.bg === '0F172A' ? 'FFFFFF' : '0F172A',
                bullet: { color: palette.bullet },
                breakLine: !isFirstBullet // break line before this bullet if it's not the first
              }
            });
            flatTextProps.push({
              text: point.substring(colonIndex + 1)
            });
          } else {
            flatTextProps.push({
              text: point,
              options: { 
                bullet: { color: palette.bullet },
                breakLine: !isFirstBullet
              }
            });
          }
        });

        slide.addText(flatTextProps, {
          x: contentX,
          y: contentStartY,
          w: contentWidth,
          h: 3.2,
          valign: "top",
          lineSpacing: 18,
          color: palette.text, 
          fontSize: 16, 
          fontFace: "Calibri",
          fit: "shrink",
          autoFit: true,
        });
      }

      // Add AI Image on the right side if present
      if (hasImage) {
        const imageConfig: any = {
          x: 5.2,
          y: 1.3,
          w: 4.3,
          h: 3.5,
          sizing: { type: "cover" } // Cover the 4.3x3.5 box beautifully
        };

        if (slideData.imageData) {
          imageConfig.data = slideData.imageData;
        } else if (slideData.imageUrl) {
          imageConfig.path = slideData.imageUrl;
        }

        slide.addImage(imageConfig);
        
        // Add a subtle frame/shadow effect around the image
        slide.addShape(pres.ShapeType.rect, {
           x: 5.2, y: 1.3, w: 4.3, h: 3.5,
           line: { color: "E2E8F0", width: 2 },
           fill: { type: "none" }
        });
      }
    }

    // Speaker Notes
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }
  });

  // Save the presentation
  const fileName = `${safeTopic.replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 50)}_presentation.pptx`;
  await pres.writeFile({ fileName });
}
