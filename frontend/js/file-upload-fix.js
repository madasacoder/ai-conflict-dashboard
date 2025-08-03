/**
 * Fixed file upload handler that properly handles duplicate filenames
 *
 * This module fixes BUG-007 by adding numbering to duplicate filenames
 * to help users distinguish between files with the same name.
 *
 * Note: Requires logger.js to be loaded before this script
 */

// Store uploaded files metadata
const uploadedFilesMap = new Map();

/**
 * Handle file upload with duplicate filename detection
 * @param {Event} event - The file input change event
 */
function handleFileUploadFixed(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    return;
  }

  logger.userAction('files_selected', 'file_upload', {
    count: files.length,
    component: 'file_upload_fix',
  });

  const filesList = document.getElementById('filesList');
  filesList.innerHTML = ''; // Clear previous files list

  // Clear the map
  uploadedFilesMap.clear();

  const existingContent = document.getElementById('inputText').value;
  let combinedContent = existingContent ? existingContent + '\n\n' : '';
  let filesProcessed = 0;

  // Create a container for file badges
  const filesContainer = document.createElement('div');
  filesContainer.className = 'd-flex flex-wrap gap-2';
  filesList.appendChild(filesContainer);

  // Track filenames for duplicate detection
  const filenameCount = {};

  // First pass: count duplicates
  Array.from(files).forEach((file) => {
    const basename = file.name;
    filenameCount[basename] = (filenameCount[basename] || 0) + 1;
  });

  // Track current count for each filename
  const currentCount = {};

  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();
    const basename = file.name;

    // Generate display name with number if duplicate
    let displayName = basename;
    if (filenameCount[basename] > 1) {
      currentCount[basename] = (currentCount[basename] || 0) + 1;
      displayName = `${basename} (${currentCount[basename]})`;
    }

    // Store file metadata
    const fileId = `file-${index}-${Date.now()}`;
    uploadedFilesMap.set(fileId, {
      originalName: file.name,
      displayName: displayName,
      size: file.size,
      type: file.type || 'text/plain',
      lastModified: file.lastModified,
    });

    reader.onload = function (e) {
      const content = e.target.result;

      // Add file separator with display name
      if (index > 0 || existingContent) {
        combinedContent += '\n\n';
      }
      combinedContent += `--- File: ${displayName} ---\n\n${content}`;

      // Create file badge with enhanced info
      const fileBadge = document.createElement('span');
      fileBadge.className = 'badge bg-primary position-relative';
      fileBadge.setAttribute('data-file-id', fileId);
      fileBadge.setAttribute('data-bs-toggle', 'tooltip');
      fileBadge.setAttribute('data-bs-placement', 'top');
      fileBadge.setAttribute(
        'title',
        `Size: ${formatFileSize(file.size)}\nType: ${file.type || 'text/plain'}`
      );

      const badgeContent = `
                <i class="bi bi-file-text me-1"></i>${escapeHtml(displayName)}
                <button type="button" class="btn-close btn-close-white ms-2" style="font-size: 0.7rem;" 
                        onclick="removeFileFixed('${fileId}')"></button>
            `;
      // eslint-disable-next-line no-unsanitized/property
      fileBadge.innerHTML = DOMPurify.sanitize(badgeContent);

      filesContainer.appendChild(fileBadge);

      // Initialize tooltip
      new bootstrap.Tooltip(fileBadge);

      filesProcessed++;

      // Update textarea when all files are processed
      if (filesProcessed === files.length) {
        document.getElementById('inputText').value = combinedContent;
        updateCounts();

        logger.info('all_files_loaded_successfully', {
          total_files: files.length,
          total_length: combinedContent.length,
          component: 'file_upload_fix',
        });
      }
    };

    reader.onerror = function () {
      logger.error('file_read_error', {
        file_name: file.name,
        component: 'file_upload_fix',
      });
      showError(`Failed to read file: ${file.name}`);
      filesProcessed++;
    };

    reader.readAsText(file);
  });
}

/**
 * Remove a file from the combined content
 * @param {string} fileId - The unique file ID
 */
function removeFileFixed(fileId) {
  const fileInfo = uploadedFilesMap.get(fileId);
  if (!fileInfo) {
    return;
  }

  const displayName = fileInfo.displayName;
  const textarea = document.getElementById('inputText');
  const content = textarea.value;

  // Remove the file section from content
  const fileHeader = `--- File: ${displayName} ---`;
  const startIndex = content.indexOf(fileHeader);

  if (startIndex !== -1) {
    // Find the next file header or end of content
    const nextFileIndex = content.indexOf('\n--- File:', startIndex + 1);
    const endIndex = nextFileIndex !== -1 ? nextFileIndex : content.length;

    // Remove the file section and clean up extra newlines
    let newContent = content.substring(0, startIndex) + content.substring(endIndex);
    newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();

    textarea.value = newContent;
    updateCounts();
  }

  // Remove the badge
  const badge = document.querySelector(`[data-file-id="${fileId}"]`);
  if (badge) {
    // Dispose tooltip
    const tooltip = bootstrap.Tooltip.getInstance(badge);
    if (tooltip) {
      tooltip.dispose();
    }
    badge.remove();
  }

  // Remove from map
  uploadedFilesMap.delete(fileId);

  logger.userAction('file_removed', 'file_upload', {
    display_name: displayName,
    component: 'file_upload_fix',
  });
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions for use
window.handleFileUploadFixed = handleFileUploadFixed;
window.removeFileFixed = removeFileFixed;
