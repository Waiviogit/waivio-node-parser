const { JSDOM } = require('jsdom');
const createDOMPurify = require('isomorphic-dompurify');

/**
 * Policy: allow HTML & CSS only; forbid all JS execution vectors.
 * - Forbid <script>, <iframe>, <object>, <embed>, <applet>, <canvas> (optional),
 *   <link rel=preload|modulepreload>
 * - Forbid event handlers: on*
 * - Forbid javascript: URLs and dangerous data: SVG payloads
 * - Allow <style> and style="" but block url(javascript:...) and @import javascript:
 */
const validateHtmlNoScripts = (html, returnSanitized = false) => {
  const { window } = new JSDOM('');
  const DOMPurify = createDOMPurify(window);

  const errors = [];

  // Disallowed tags that can execute or embed active content
  const FORBID_TAGS = [
    'script', 'iframe', 'object', 'embed', 'applet',
    'source', 'track', // often fine, but can fetch remote
    'canvas', // optional: remove if you want to allow
    'noscript', // can hide payload
    'template', 'slot', // DOM trickery
  ];

  // We’ll allow <link> only for stylesheets
  // Everything else (preload, modulepreload, etc.) is forbidden
  const ALLOWED_TAGS = false; // let DOMPurify default & FORBID_TAGS handle the denylist

  // Forbid all inline event handlers, JS-y URLs, and risky attributes
  const FORBID_ATTR = [
    // Dangerous URL-ish attributes covered via hooks
    'srcset', // complex URL list; safer to forbid unless you explicitly handle parsing
  ];

  // Hooks to *detect* and also let DOMPurify remove offenders
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    const tag = data.tagName?.toLowerCase?.() || '';
    if (FORBID_TAGS.includes(tag)) {
      errors.push(`Forbidden tag <${tag}>`);
      return; // DOMPurify will drop it if we add to FORBID_TAGS
    }
    if (tag === 'link') {
      const rel = (node.getAttribute?.('rel') || '').toLowerCase();
      if (!['preconnect', 'stylesheet'].includes(rel)) {
        errors.push(`<link rel="${rel}"> is not allowed (only rel="stylesheet")`);
        // Mark as forbidden by changing data.allowedTags?
        // Easier: remove it here:
        node.parentNode?.removeChild(node);
      }
    }
    if (tag === 'meta') {
      const httpEquiv = (node.getAttribute?.('http-equiv') || '').toLowerCase();
      if (httpEquiv === 'refresh') {
        errors.push('<meta http-equiv="refresh"> is not allowed');
        node.parentNode?.removeChild(node);
      }
    }
  });

  // Remove “on*” handlers and log
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    const name = (data.attrName || '').toLowerCase();
    const value = data.attrValue || '';

    // 1) Block any inline event handler
    if (name.startsWith('on')) {
      errors.push(`Event handler attribute "${name}" is not allowed`);
      data.keepAttr = false;
      return;
    }

    // 2) Block javascript: protocol (spaces/encoding tolerant)
    const looksLikeJsProtocol = (s) => /^(\s*|['"]?\s*)j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i.test(s);

    // Attributes that can carry URLs
    const urlAttrs = new Set(['href', 'src', 'xlink:href', 'formaction', 'poster']);
    if (urlAttrs.has(name)) {
      if (looksLikeJsProtocol(value)) {
        errors.push(`javascript: URL in ${name} is not allowed`);
        data.keepAttr = false;
        return;
      }
      // For data: URLs, allow only safe image mime-types. Block SVG due to onload/script.
      const v = value.trim().replace(/^['"]|['"]$/g, '');
      if (/^data:/i.test(v)) {
        const mime = v.slice(5).split(/[;,]/, 1)[0].toLowerCase();
        const safeDataImages = new Set([
          'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
        ]);
        if (!safeDataImages.has(mime)) {
          errors.push(`data: URL with mime "${mime}" in ${name} is not allowed`);
          data.keepAttr = false;
          return;
        }
      }
    }

    // 3) CSS sanitization inside style="" — block url(javascript:...) and @import javascript:
    if (name === 'style') {
      // Very conservative checks:
      const css = value.toLowerCase().replace(/\s+/g, '');
      if (css.includes('expression(')) {
        errors.push('CSS expression() is not allowed in style attribute');
        data.keepAttr = false;
        return;
      }
      if (/url\(\s*(['"])?\s*javascript\s*:/.test(value)) {
        errors.push('CSS url(javascript:...) is not allowed in style attribute');
        data.keepAttr = false;
        return;
      }
      if (/@import\s+(['"])?\s*javascript\s*:/.test(value)) {
        errors.push('CSS @import javascript: is not allowed in style attribute');
        data.keepAttr = false;
        return;
      }
      // Optional: block -moz-binding (ancient, but dangerous)
      if (css.includes('-moz-binding')) {
        errors.push('CSS -moz-binding is not allowed');
        data.keepAttr = false;
      }
    }
  });

  const config = {
    ALLOWED_TAGS, // let default + our hooks/forbids operate
    FORBID_TAGS, // our denylist
    FORBID_ATTR, // baseline
    // Allow inline styles but they are scanned by our hook above:
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'rel', 'href', 'src', 'alt', 'title', 'name',
      'width', 'height', 'type', 'media', 'integrity', 'crossorigin',
    ],
    // Only allow stylesheets in <link>
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^:]+$)/i,
    KEEP_CONTENT: false,
    RETURN_DOM: false,
    WHOLE_DOCUMENT: true,
  };

  const sanitized = DOMPurify.sanitize(html, config);
  const ok = errors.length === 0;

  return returnSanitized
    ? { ok, errors, sanitized }
    : { ok, errors };
};

module.exports = {
  validateHtmlNoScripts,
};
