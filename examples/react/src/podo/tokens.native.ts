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
      "1": 4,
      "2": 8
    },
    "component": {
      "field-gap": 8
    }
  },
  "radius": {
    "control": {
      "md": 8
    }
  },
  "typography": {
    "h1": {
      "landing": {
        "fontFamily": "Pretendard",
        "fontSize": 64,
        "lineHeight": 72,
        "fontWeight": 700,
        "letterSpacing": 0
      },
      "dashboard": {
        "fontFamily": "Pretendard",
        "fontSize": 28,
        "lineHeight": 36,
        "fontWeight": 600,
        "letterSpacing": 0
      }
    },
    "heading": {
      "xlarge": {
        "fontFamily": "Pretendard",
        "fontSize": {
          "pc": 32,
          "tablet": 28,
          "mobile": 24
        },
        "lineHeight": "120%",
        "fontWeight": 700,
        "letterSpacing": 0
      }
    },
    "body": {
      "medium": {
        "fontFamily": "Pretendard",
        "fontSize": {
          "pc": 16,
          "tablet": 16,
          "mobile": 14
        },
        "lineHeight": "160%",
        "fontWeight": 400,
        "letterSpacing": 0
      }
    }
  }
} as const;
