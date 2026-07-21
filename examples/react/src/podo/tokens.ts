export const tokens = {
  "color": {
    "brand": "#426CED",
    "text": "#18181B",
    "inverse": "#FFFFFF",
    "danger": "#F23B3B",
    "palette": {
      "gray": {
        "5": "#F9F9F9",
        "10": "#F4F4F5",
        "70": "#3E424B",
        "90": "#18181B"
      },
      "error": {
        "5": "#FEF1F1",
        "50": "#F23B3B"
      },
      "success": {
        "5": "#ECF8EF",
        "50": "#3EA856"
      },
      "warning": {
        "5": "#FFF7E6",
        "50": "#FFAA00"
      },
      "info": {
        "5": "#EBF5FF",
        "50": "#0095FF"
      },
      "purple": {
        "5": "#F8F5FF",
        "50": "#8E51FF"
      },
      "orange": {
        "5": "#FFF4F0",
        "50": "#FF6A33"
      },
      "accent": {
        "50": "#F15764"
      }
    }
  },
  "semantic": {
    "color": {
      "text": {
        "default": "#18181B",
        "inverse": "#FFFFFF",
        "danger": "#F23B3B"
      }
    }
  },
  "component": {
    "button": {
      "background": "#426CED",
      "text": "#FFFFFF"
    },
    "input": {
      "background": "#FFFFFF",
      "border": "#18181B"
    }
  },
  "spacing": {
    "scale": {
      "1": "4px",
      "2": "8px"
    },
    "component": {
      "field-gap": "8px"
    }
  },
  "radius": {
    "control": {
      "md": "8px"
    }
  },
  "typography": {
    "h1": {
      "landing": {
        "fontFamily": "Pretendard",
        "fontSize": "64px",
        "lineHeight": "72px",
        "fontWeight": 700,
        "letterSpacing": "0px"
      },
      "dashboard": {
        "fontFamily": "Pretendard",
        "fontSize": "28px",
        "lineHeight": "36px",
        "fontWeight": 600,
        "letterSpacing": "0px"
      }
    },
    "heading": {
      "xlarge": {
        "fontFamily": "Pretendard",
        "fontSize": {
          "pc": "32px",
          "tablet": "28px",
          "mobile": "24px"
        },
        "lineHeight": "120%",
        "fontWeight": 700,
        "letterSpacing": "0px"
      }
    },
    "body": {
      "medium": {
        "fontFamily": "Pretendard",
        "fontSize": {
          "pc": "16px",
          "tablet": "16px",
          "mobile": "14px"
        },
        "lineHeight": "160%",
        "fontWeight": 400,
        "letterSpacing": "0px"
      }
    }
  }
} as const;

export type TokenPath = "color.brand" | "color.danger" | "color.inverse" | "color.palette.accent.50" | "color.palette.error.5" | "color.palette.error.50" | "color.palette.gray.10" | "color.palette.gray.5" | "color.palette.gray.70" | "color.palette.gray.90" | "color.palette.info.5" | "color.palette.info.50" | "color.palette.orange.5" | "color.palette.orange.50" | "color.palette.purple.5" | "color.palette.purple.50" | "color.palette.success.5" | "color.palette.success.50" | "color.palette.warning.5" | "color.palette.warning.50" | "color.text" | "component.button.background" | "component.button.text" | "component.input.background" | "component.input.border" | "radius.control.md" | "semantic.color.text.danger" | "semantic.color.text.default" | "semantic.color.text.inverse" | "spacing.component.field-gap" | "spacing.scale.1" | "spacing.scale.2" | "typography.body.medium" | "typography.h1.dashboard" | "typography.h1.landing" | "typography.heading.xlarge";
