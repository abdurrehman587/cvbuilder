import React, { useRef, useEffect } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = "Description" }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const isActive = (command) => {
    return document.queryCommandState(command);
  };

  const formatBulletList = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Check if we have selected content
    if (range.collapsed) {
      // No selection, insert bullet list at cursor
      execCommand('insertUnorderedList');
      return;
    }

    // Get the selected content HTML
    const selectedHtml = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(selectedHtml);

    // Extract lines from the content
    // First, try to get lines from block elements (p, div, li)
    const blockElements = tempDiv.querySelectorAll('p, div, li');
    let lines = [];
    
    if (blockElements.length > 0) {
      // Each block element is a line
      lines = Array.from(blockElements).map(el => {
        const text = el.textContent || el.innerText || '';
        return text.trim();
      });
    } else {
      // No block elements, get all text and split by newlines
      const allText = tempDiv.textContent || tempDiv.innerText || '';
      lines = allText.split(/\r?\n/).map(line => line.trim());
    }

    // Filter out empty lines and create list items
    const listItems = lines
      .filter(line => line.length > 0)
      .map(line => `<li>${line}</li>`)
      .join('');

    if (listItems) {
      const listHtml = `<ul>${listItems}</ul>`;
      
      // Delete the selected content
      range.deleteContents();
      
      // Create and insert the list
      const listDiv = document.createElement('div');
      listDiv.innerHTML = listHtml;
      const fragment = document.createDocumentFragment();
      while (listDiv.firstChild) {
        fragment.appendChild(listDiv.firstChild);
      }
      range.insertNode(fragment);
      
      // Clear selection and update
      selection.removeAllRanges();
      handleInput();
    } else {
      // If no valid lines, just insert a bullet list
      execCommand('insertUnorderedList');
    }
  };

  const formatNumberedList = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      execCommand('insertOrderedList');
      return;
    }

    const range = selection.getRangeAt(0);
    
    // Check if we have selected content
    if (range.collapsed) {
      // No selection, insert numbered list at cursor
      execCommand('insertOrderedList');
      return;
    }

    // Get the selected content HTML
    const selectedHtml = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(selectedHtml);

    // Extract lines from the content
    // First, try to get lines from block elements (p, div, li)
    const blockElements = tempDiv.querySelectorAll('p, div, li');
    let lines = [];
    
    if (blockElements.length > 0) {
      // Each block element is a line
      lines = Array.from(blockElements).map(el => {
        const text = el.textContent || el.innerText || '';
        return text.trim();
      });
    } else {
      // No block elements, get all text and split by newlines
      const allText = tempDiv.textContent || tempDiv.innerText || '';
      lines = allText.split(/\r?\n/).map(line => line.trim());
    }

    // Filter out empty lines and create list items
    const listItems = lines
      .filter(line => line.length > 0)
      .map(line => `<li>${line}</li>`)
      .join('');

    if (listItems) {
      const listHtml = `<ol>${listItems}</ol>`;
      
      // Delete the selected content
      range.deleteContents();
      
      // Create and insert the list
      const listDiv = document.createElement('div');
      listDiv.innerHTML = listHtml;
      const fragment = document.createDocumentFragment();
      while (listDiv.firstChild) {
        fragment.appendChild(listDiv.firstChild);
      }
      range.insertNode(fragment);
      
      // Clear selection and update
      selection.removeAllRanges();
      handleInput();
    } else {
      // If no valid lines, just insert a numbered list
      execCommand('insertOrderedList');
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar">
        <button
          type="button"
          className={`toolbar-btn ${isActive('bold') ? 'active' : ''}`}
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${isActive('italic') ? 'active' : ''}`}
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${isActive('underline') ? 'active' : ''}`}
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="toolbar-divider"></div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatBulletList}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatNumberedList}
          title="Numbered List"
        >
          1.
        </button>
        <div className="toolbar-divider"></div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => execCommand('removeFormat')}
          title="Remove Formatting"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        className="rich-text-content"
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          handleInput();
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;

