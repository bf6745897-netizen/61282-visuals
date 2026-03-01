(function () {
  const formElements = {
    primaryColor: document.getElementById('primary-color'),
    primaryHex: document.getElementById('primary-hex'),
    secondaryColor: document.getElementById('secondary-color'),
    secondaryHex: document.getElementById('secondary-hex'),
    displayFont: document.getElementById('display-font'),
    bodyFont: document.getElementById('body-font'),
    baseSize: document.getElementById('base-size'),
    generateButton: document.getElementById('generate-btn'),
    downloadButton: document.getElementById('download-btn'),
    status: document.getElementById('status')
  };

  let generatedCsv = '';

  function normalizeHex(value) {
    const cleaned = value.trim().replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(cleaned)) {
      return '#' + cleaned;
    }
    return null;
  }

  function hexToRgb(hex) {
    const parsed = normalizeHex(hex);
    if (!parsed) {
      return null;
    }

    return {
      r: parseInt(parsed.slice(1, 3), 16),
      g: parseInt(parsed.slice(3, 5), 16),
      b: parseInt(parsed.slice(5, 7), 16)
    };
  }

  function rgbToHex(rgb) {
    const channels = [rgb.r, rgb.g, rgb.b].map(function (channel) {
      const safe = Math.max(0, Math.min(255, Math.round(channel)));
      return safe.toString(16).padStart(2, '0').toUpperCase();
    });

    return '#' + channels.join('');
  }

  function mixRgb(colorA, colorB, ratio) {
    return {
      r: colorA.r + (colorB.r - colorA.r) * ratio,
      g: colorA.g + (colorB.g - colorA.g) * ratio,
      b: colorA.b + (colorB.b - colorA.b) * ratio
    };
  }

  function formatSize(value) {
    const rounded = Math.round(value * 100) / 100;
    if (Number.isInteger(rounded)) {
      return rounded + 'px';
    }
    return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + 'px';
  }

  function setStatus(message, isError) {
    formElements.status.textContent = message;
    formElements.status.classList.toggle('error', Boolean(isError));
  }

  function syncColorFromPicker(colorInput, hexInput) {
    hexInput.value = colorInput.value.toUpperCase();
  }

  function syncColorFromHex(hexInput, colorInput) {
    const normalized = normalizeHex(hexInput.value);
    if (normalized) {
      colorInput.value = normalized;
      hexInput.value = normalized;
      return true;
    }
    return false;
  }

  function buildColorScale(baseHex, prefix) {
    const base = hexToRgb(baseHex);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const values = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

    return values.map(function (step) {
      let colorValue = baseHex;

      if (step > 50 && step < 100) {
        const ratio = (100 - step) / 50;
        colorValue = rgbToHex(mixRgb(base, white, ratio));
      } else if (step < 50) {
        const ratio = (50 - step) / 40;
        colorValue = rgbToHex(mixRgb(base, black, ratio));
      }

      return [prefix + '/' + step, 'Color', colorValue, 'Colors'];
    });
  }

  function buildNeutralScale(name, solidHex) {
    const scale = [
      ['Color/' + name + '/100', 'Color', solidHex, 'Colors']
    ];

    for (let step = 90; step >= 10; step -= 10) {
      scale.push([
        'Color/' + name + '/' + step,
        'Color',
        'rgba(' + (name === 'White' ? '255,255,255' : '0,0,0') + ',' + (step / 100).toFixed(1) + ')',
        'Colors'
      ]);
    }

    return scale;
  }

  function buildRows() {
    const primaryHex = normalizeHex(formElements.primaryHex.value);
    const secondaryHex = normalizeHex(formElements.secondaryHex.value);
    const displayFont = formElements.displayFont.value.trim();
    const bodyFont = formElements.bodyFont.value.trim();
    const baseSize = Number(formElements.baseSize.value);

    if (!primaryHex || !secondaryHex) {
      throw new Error('Please enter valid 6-digit hex colors for primary and secondary.');
    }

    if (!displayFont || !bodyFont) {
      throw new Error('Please provide both display and body font names.');
    }

    if (!Number.isFinite(baseSize) || baseSize <= 0) {
      throw new Error('Base font size must be a positive number.');
    }

    const rows = [['Name', 'Type', 'Value', 'Group']];

    rows.push.apply(rows, buildColorScale(primaryHex, 'Color/Primary'));
    rows.push.apply(rows, buildColorScale(secondaryHex, 'Color/Secondary'));
    rows.push.apply(rows, buildNeutralScale('White', '#FFFFFF'));
    rows.push.apply(rows, buildNeutralScale('Black', '#000000'));

    rows.push(['Font/Display', 'Font', displayFont, 'Fonts']);
    rows.push(['Font/Body', 'Font', bodyFont, 'Fonts']);

    const typeScale = [
      { label: 'Display', multiplier: 3.5, height: '1.1', tracking: '-0.02em' },
      { label: 'H1', multiplier: 2.5, height: '1.2', tracking: '-0.01em' },
      { label: 'H2', multiplier: 2.0, height: '1.2', tracking: '-0.01em' },
      { label: 'H3', multiplier: 1.5, height: '1.2', tracking: '-0.01em' },
      { label: 'Body', multiplier: 1.0, height: '1.5', tracking: '0em' },
      { label: 'Small', multiplier: 0.875, height: '1.5', tracking: '0em' }
    ];

    typeScale.forEach(function (entry) {
      rows.push(['Text/' + entry.label + '/Size', 'Size', formatSize(baseSize * entry.multiplier), 'Typography']);
      rows.push(['Text/' + entry.label + '/Height', 'Number', entry.height, 'Typography']);
      rows.push(['Text/' + entry.label + '/Tracking', 'Size', entry.tracking, 'Typography']);
    });

    [4, 8, 16, 24, 32, 48, 64, 96].forEach(function (space) {
      rows.push(['Space/' + space, 'Size', space + 'px', 'Spacing']);
    });

    rows.push(['Radius/SM', 'Size', '4px', 'Radius']);
    rows.push(['Radius/MD', 'Size', '8px', 'Radius']);
    rows.push(['Radius/LG', 'Size', '16px', 'Radius']);
    rows.push(['Radius/Round', 'Size', '999px', 'Radius']);

    return rows;
  }

  function csvEscape(value) {
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
  }

  function rowsToCsv(rows) {
    return rows
      .map(function (row) {
        return row.map(csvEscape).join(',');
      })
      .join('\n');
  }

  function downloadCsv(content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'webflow-variables.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  formElements.primaryColor.addEventListener('input', function () {
    syncColorFromPicker(formElements.primaryColor, formElements.primaryHex);
  });

  formElements.secondaryColor.addEventListener('input', function () {
    syncColorFromPicker(formElements.secondaryColor, formElements.secondaryHex);
  });

  formElements.primaryHex.addEventListener('input', function () {
    syncColorFromHex(formElements.primaryHex, formElements.primaryColor);
  });

  formElements.secondaryHex.addEventListener('input', function () {
    syncColorFromHex(formElements.secondaryHex, formElements.secondaryColor);
  });

  formElements.generateButton.addEventListener('click', function () {
    try {
      if (!syncColorFromHex(formElements.primaryHex, formElements.primaryColor) || !syncColorFromHex(formElements.secondaryHex, formElements.secondaryColor)) {
        throw new Error('Please enter valid 6-digit hex colors before generating.');
      }

      const rows = buildRows();
      generatedCsv = rowsToCsv(rows);
      formElements.downloadButton.disabled = false;
      setStatus('Generated ' + (rows.length - 1) + ' variables. Ready to download.', false);
    } catch (error) {
      generatedCsv = '';
      formElements.downloadButton.disabled = true;
      setStatus(error.message, true);
    }
  });

  formElements.downloadButton.addEventListener('click', function () {
    if (!generatedCsv) {
      setStatus('Generate variables first.', true);
      return;
    }

    downloadCsv(generatedCsv);
    setStatus('Downloaded webflow-variables.csv.', false);
  });
})();
