(function () {
  const MIN_COLORS = 2;
  const MAX_COLORS = 5;

  const colorList = document.getElementById('color-list');
  const addColorButton = document.getElementById('add-color');
  const removeColorButton = document.getElementById('remove-color');
  const previewCount = document.getElementById('preview-count');
  const status = document.getElementById('status');
  const form = document.getElementById('generator-form');

  const fontInputs = {
    Display: document.getElementById('font-display'),
    Body: document.getElementById('font-body'),
    Mono: document.getElementById('font-mono')
  };

  const baseSizeInput = document.getElementById('base-size');

  const defaultColors = [
    { label: 'Primary', hex: '#3D5A80' },
    { label: 'Accent', hex: '#EE6C4D' }
  ];

  function createColorRow(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-row';

    wrapper.innerHTML =
      '<label class="field"><span>Label</span><input type="text" class="color-label" /></label>' +
      '<label class="field"><span>Hex</span><input type="text" class="color-hex mono" maxlength="7" placeholder="#RRGGBB" /></label>' +
      '<p class="inline-error" aria-live="polite"></p>';

    const labelInput = wrapper.querySelector('.color-label');
    const hexInput = wrapper.querySelector('.color-hex');

    labelInput.value = data.label;
    hexInput.value = data.hex;

    [labelInput, hexInput].forEach(function (input) {
      input.addEventListener('input', function () {
        validateColorRow(wrapper);
        updatePreviewCount();
      });
    });

    colorList.appendChild(wrapper);
  }

  function normalizeHex(value) {
    const cleaned = value.trim().replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(cleaned)) {
      return '#' + cleaned;
    }
    return null;
  }

  function validateColorRow(row) {
    const label = row.querySelector('.color-label').value.trim();
    const hexInput = row.querySelector('.color-hex');
    const error = row.querySelector('.inline-error');
    const normalized = normalizeHex(hexInput.value);

    if (!label) {
      error.textContent = 'Label is required.';
      return false;
    }

    if (!normalized) {
      error.textContent = 'Enter a valid 6-digit hex color (#RRGGBB).';
      return false;
    }

    hexInput.value = normalized;
    error.textContent = '';
    return true;
  }

  function getColorInputs() {
    const rows = Array.from(colorList.querySelectorAll('.color-row'));
    return rows.map(function (row) {
      return {
        label: row.querySelector('.color-label').value.trim(),
        hex: row.querySelector('.color-hex').value.trim(),
        row: row
      };
    });
  }

  function getFontInputs() {
    const fonts = [];
    Object.keys(fontInputs).forEach(function (label) {
      const value = fontInputs[label].value.trim();
      if (value) {
        fonts.push({ label: label, value: value });
      }
    });
    return fonts;
  }

  function updatePreviewCount() {
    const colors = getColorInputs();
    const fonts = getFontInputs();
    const validColorCount = colors.filter(function (c) {
      return c.label && normalizeHex(c.hex);
    }).length;

    const total = 103 + validColorCount * 16 + fonts.length;
    previewCount.textContent = 'Variables to generate: ' + total;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    return {
      r: parseInt(normalized.slice(1, 3), 16),
      g: parseInt(normalized.slice(3, 5), 16),
      b: parseInt(normalized.slice(5, 7), 16)
    };
  }

  function rgbToHex(rgb) {
    return (
      '#' +
      [rgb.r, rgb.g, rgb.b]
        .map(function (channel) {
          return Math.round(Math.max(0, Math.min(255, channel)))
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();
        })
        .join('')
    );
  }

  function tintHex(baseHex, step) {
    const rgb = hexToRgb(baseHex);
    const ratio = step / 100;
    return rgbToHex({
      r: rgb.r * ratio + 255 * (1 - ratio),
      g: rgb.g * ratio + 255 * (1 - ratio),
      b: rgb.b * ratio + 255 * (1 - ratio)
    });
  }

  function formatNumber(value) {
    const fixed = Number(value.toFixed(4));
    return String(fixed);
  }

  function csvEscape(value) {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function row(name, type, value, unit) {
    return [name, type, value, unit || '', 'false'];
  }

  function buildRows(colors, fonts, baseSize) {
    const rows = [['Name', 'Type', 'Value', 'Unit', 'Linked Variable']];

    colors.forEach(function (color) {
      const normalizedHex = normalizeHex(color.hex);
      const rgb = hexToRgb(normalizedHex);

      rows.push(row('Brand/' + color.label, 'Color', normalizedHex, ''));

      for (let step = 10; step <= 90; step += 10) {
        rows.push(row('Scale/' + color.label + '/' + step, 'Color', tintHex(normalizedHex, step), ''));
      }
      rows.push(row('Scale/' + color.label + '/100', 'Color', normalizedHex, ''));

      [10, 20, 40, 60, 80].forEach(function (alphaPercent) {
        const alpha = (alphaPercent / 100).toFixed(2);
        rows.push(row('Overlay/' + color.label + '/' + alphaPercent, 'Color', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')', ''));
      });
    });

    [
      ['Overlay/White/5', 'rgba(255,255,255,0.05)'],
      ['Overlay/White/10', 'rgba(255,255,255,0.10)'],
      ['Overlay/White/20', 'rgba(255,255,255,0.20)'],
      ['Overlay/White/40', 'rgba(255,255,255,0.40)'],
      ['Overlay/White/60', 'rgba(255,255,255,0.60)'],
      ['Overlay/Black/5', 'rgba(0,0,0,0.05)'],
      ['Overlay/Black/10', 'rgba(0,0,0,0.10)'],
      ['Overlay/Black/20', 'rgba(0,0,0,0.20)'],
      ['Overlay/Black/40', 'rgba(0,0,0,0.40)'],
      ['Overlay/Black/60', 'rgba(0,0,0,0.60)']
    ].forEach(function (entry) {
      rows.push(row(entry[0], 'Color', entry[1], ''));
    });

    const accent = normalizeHex(colors[1] ? colors[1].hex : colors[0].hex);
    [
      ['Surface/Page', '#F8F8F8'],
      ['Surface/White', '#FFFFFF'],
      ['Surface/Dark', '#0E0E0E'],
      ['Text/Primary', '#0E0E0E'],
      ['Text/Muted', '#6B6760'],
      ['Text/Inverse', '#FFFFFF'],
      ['Text/Accent', accent],
      ['Border/Default', '#D8D4CC'],
      ['Border/Accent', accent]
    ].forEach(function (token) {
      rows.push(row(token[0], 'Color', token[1], ''));
    });

    fonts.forEach(function (font) {
      rows.push(row('Typography/Font-' + font.label, 'FontFamily', font.value, ''));
    });

    const typeScale = [
      ['Typography/Size-2xs', 0.6875],
      ['Typography/Size-xs', 0.75],
      ['Typography/Size-sm', 0.8125],
      ['Typography/Size-base-sm', 0.875],
      ['Typography/Size-base', 1.0],
      ['Typography/Size-md', 1.0625],
      ['Typography/Size-lg', 1.125],
      ['Typography/Size-xl', 1.25],
      ['Typography/Size-2xl', 1.375],
      ['Typography/Size-3xl', 1.5],
      ['Typography/Size-4xl', 1.75],
      ['Typography/Size-5xl', 2.0],
      ['Typography/Size-6xl', 2.25],
      ['Typography/Size-7xl', 2.625],
      ['Typography/Size-8xl', 3.0],
      ['Typography/Size-display-sm', 3.5],
      ['Typography/Size-display-md', 4.25],
      ['Typography/Size-display-lg', 5.0]
    ];

    typeScale.forEach(function (item) {
      const pxSize = baseSize * item[1];
      const rem = pxSize / baseSize;
      rows.push(row(item[0], 'Size', formatNumber(rem), 'rem'));
    });

    [
      ['Typography/Eyebrow', 0.6875],
      ['Typography/Nav', 0.8125],
      ['Typography/Body-SM', 0.875],
      ['Typography/Body', 1],
      ['Typography/Body-LG', 1.125],
      ['Typography/H4', 1.375],
      ['Typography/H3', 1.625],
      ['Typography/H2', 2],
      ['Typography/H1', 3.25],
      ['Typography/Hero', 4.25]
    ].forEach(function (item) {
      rows.push(row(item[0], 'Size', formatNumber(item[1]), 'rem'));
    });

    [
      ['Typography/LS-Tight', -0.02],
      ['Typography/LS-Normal', 0],
      ['Typography/LS-Wide', 0.06],
      ['Typography/LS-Wider', 0.08],
      ['Typography/LS-Widest', 0.14],
      ['Typography/LS-Caps', 0.16]
    ].forEach(function (item) {
      rows.push(row(item[0], 'Size', formatNumber(item[1]), 'em'));
    });

    [
      ['Typography/LH-Tight', 1.08],
      ['Typography/LH-Heading', 1.1],
      ['Typography/LH-Body', 1.7],
      ['Typography/LH-Relaxed', 1.85]
    ].forEach(function (item) {
      rows.push(row(item[0], 'Size', formatNumber(item[1]), 'em'));
    });

    [
      ['Typography/Weight-Light', 300],
      ['Typography/Weight-Regular', 400],
      ['Typography/Weight-Medium', 500],
      ['Typography/Weight-Bold', 700]
    ].forEach(function (item) {
      rows.push(row(item[0], 'Size', item[1], 'px'));
    });

    [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 60, 80].forEach(function (value) {
      rows.push(row('Spacing/' + value, 'Size', value * 4, 'px'));
    });

    [
      ['Spacing/Padding-XS', 8],
      ['Spacing/Padding-SM', 16],
      ['Spacing/Padding-MD', 24],
      ['Spacing/Padding-LG', 40],
      ['Spacing/Padding-XL', 60],
      ['Spacing/Padding-2XL', 80],
      ['Spacing/Padding-Section', 120],
      ['Spacing/Gap-XS', 8],
      ['Spacing/Gap-SM', 16],
      ['Spacing/Gap-MD', 24],
      ['Spacing/Gap-LG', 40],
      ['Spacing/Gap-XL', 60],
      ['Spacing/Gap-Grid', 100],
      ['Spacing/Border-Thin', 1],
      ['Spacing/Border-Medium', 2],
      ['Spacing/Border-Thick', 3],
      ['Spacing/Radius-SM', 2],
      ['Spacing/Radius-MD', 4],
      ['Spacing/Radius-LG', 8],
      ['Spacing/Radius-XL', 16],
      ['Spacing/Radius-Full', 999],
      ['Spacing/Nav-Height', 88],
      ['Spacing/Container-Max', 1200]
    ].forEach(function (item) {
      rows.push(row(item[0], 'Size', item[1], 'px'));
    });

    return rows;
  }

  function rowsToCsv(rows) {
    return rows
      .map(function (r) {
        return r.map(csvEscape).join(',');
      })
      .join('\n');
  }

  function downloadCsv(content) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'webflow-variables.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function initialize() {
    defaultColors.forEach(createColorRow);
    updatePreviewCount();

    [fontInputs.Display, fontInputs.Body, fontInputs.Mono, baseSizeInput].forEach(function (input) {
      input.addEventListener('input', updatePreviewCount);
    });
  }

  addColorButton.addEventListener('click', function () {
    const count = colorList.querySelectorAll('.color-row').length;
    if (count >= MAX_COLORS) {
      status.textContent = 'You can add up to 5 colors.';
      return;
    }

    createColorRow({ label: 'Color ' + (count + 1), hex: '#999999' });
    status.textContent = '';
    updatePreviewCount();
  });

  removeColorButton.addEventListener('click', function () {
    const rows = colorList.querySelectorAll('.color-row');
    if (rows.length <= MIN_COLORS) {
      status.textContent = 'At least 2 colors are required.';
      return;
    }

    colorList.removeChild(rows[rows.length - 1]);
    status.textContent = '';
    updatePreviewCount();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const colors = getColorInputs();
    const fonts = getFontInputs();
    const baseSize = Number(baseSizeInput.value);

    let valid = true;

    if (colors.length < MIN_COLORS || colors.length > MAX_COLORS) {
      status.textContent = 'Please provide between 2 and 5 colors.';
      return;
    }

    colors.forEach(function (color) {
      if (!validateColorRow(color.row)) {
        valid = false;
      }
    });

    if (!fontInputs.Display.value.trim() || !fontInputs.Body.value.trim()) {
      status.textContent = 'Display and Body font names are required.';
      valid = false;
    }

    if (fonts.length < 2 || fonts.length > 3) {
      status.textContent = 'Provide 2 or 3 font names.';
      valid = false;
    }

    if (!baseSize || baseSize <= 0) {
      status.textContent = 'Base text size must be a positive number.';
      valid = false;
    }

    if (!valid) {
      updatePreviewCount();
      return;
    }

    const rows = buildRows(colors, fonts, baseSize);
    const csv = rowsToCsv(rows);
    downloadCsv(csv);
    status.textContent = 'Generated and downloaded ' + (rows.length - 1) + ' variables.';
    updatePreviewCount();
  });

  initialize();
})();
