/**
 * Comparison Engine for AI Conflict Dashboard
 * Handles diff highlighting, consensus detection, and similarity scoring
 */

class ComparisonEngine {
    constructor() {
        this.diffMode = 'all'; // 'all' or 'differences'
    }

    /**
     * Compare two responses and return detailed analysis
     * @param {Object} response1 - First model response
     * @param {Object} response2 - Second model response
     * @returns {Object} Comparison results with diff, consensus, similarity
     */
    compareResponses(response1, response2) {
        if (!response1 || !response2) {
            return {
                error: 'Both responses required for comparison',
                hasConsensus: false,
                similarityScore: 0
            };
        }

        const text1 = response1.response || '';
        const text2 = response2.response || '';
        
        // Split into lines for line-by-line comparison
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        
        // Calculate line-level differences
        const lineDiffs = this.computeLineDiffs(lines1, lines2);
        
        // Calculate similarity score
        const similarityScore = this.calculateSimilarity(text1, text2);
        
        // Determine consensus
        const hasConsensus = similarityScore > 0.9; // 90% similarity threshold
        
        // Find conflicts
        const conflicts = this.findConflicts(lineDiffs);
        
        return {
            model1: response1.model,
            model2: response2.model,
            lineDiffs,
            hasConsensus,
            similarityScore,
            conflicts,
            stats: {
                totalLines1: lines1.length,
                totalLines2: lines2.length,
                identicalLines: lineDiffs.filter(d => d.type === 'identical').length,
                modifiedLines: lineDiffs.filter(d => d.type === 'modified').length,
                addedLines: lineDiffs.filter(d => d.type === 'added').length,
                removedLines: lineDiffs.filter(d => d.type === 'removed').length
            }
        };
    }

    /**
     * Compute line-by-line differences using a simple LCS-based algorithm
     */
    computeLineDiffs(lines1, lines2) {
        const diffs = [];
        let i = 0, j = 0;
        
        // Simple diff algorithm - can be improved with proper LCS
        while (i < lines1.length || j < lines2.length) {
            if (i >= lines1.length) {
                // All remaining lines in lines2 are additions
                diffs.push({
                    type: 'added',
                    lineNum1: null,
                    lineNum2: j + 1,
                    content1: null,
                    content2: lines2[j]
                });
                j++;
            } else if (j >= lines2.length) {
                // All remaining lines in lines1 are deletions
                diffs.push({
                    type: 'removed',
                    lineNum1: i + 1,
                    lineNum2: null,
                    content1: lines1[i],
                    content2: null
                });
                i++;
            } else if (lines1[i].trim() === lines2[j].trim()) {
                // Lines are identical
                diffs.push({
                    type: 'identical',
                    lineNum1: i + 1,
                    lineNum2: j + 1,
                    content1: lines1[i],
                    content2: lines2[j]
                });
                i++;
                j++;
            } else {
                // Check if this is a modification or add/remove
                const similarity = this.calculateLineSimilarity(lines1[i], lines2[j]);
                
                if (similarity > 0.5) {
                    // Modified line
                    diffs.push({
                        type: 'modified',
                        lineNum1: i + 1,
                        lineNum2: j + 1,
                        content1: lines1[i],
                        content2: lines2[j],
                        similarity
                    });
                    i++;
                    j++;
                } else {
                    // Try to find matching line ahead
                    let found = false;
                    
                    // Look ahead in lines2 for matching line
                    for (let k = j + 1; k < Math.min(j + 5, lines2.length); k++) {
                        if (lines1[i].trim() === lines2[k].trim()) {
                            // Found match - lines in between are additions
                            for (let l = j; l < k; l++) {
                                diffs.push({
                                    type: 'added',
                                    lineNum1: null,
                                    lineNum2: l + 1,
                                    content1: null,
                                    content2: lines2[l]
                                });
                            }
                            j = k;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        // Look ahead in lines1 for matching line
                        for (let k = i + 1; k < Math.min(i + 5, lines1.length); k++) {
                            if (lines1[k].trim() === lines2[j].trim()) {
                                // Found match - lines in between are deletions
                                for (let l = i; l < k; l++) {
                                    diffs.push({
                                        type: 'removed',
                                        lineNum1: l + 1,
                                        lineNum2: null,
                                        content1: lines1[l],
                                        content2: null
                                    });
                                }
                                i = k;
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    if (!found) {
                        // No match found - treat as remove + add
                        diffs.push({
                            type: 'removed',
                            lineNum1: i + 1,
                            lineNum2: null,
                            content1: lines1[i],
                            content2: null
                        });
                        i++;
                    }
                }
            }
        }
        
        return diffs;
    }

    /**
     * Calculate similarity between two texts (0-1)
     */
    calculateSimilarity(text1, text2) {
        if (!text1 && !text2) return 1;
        if (!text1 || !text2) return 0;
        
        // Normalize texts
        const norm1 = text1.toLowerCase().replace(/\s+/g, ' ').trim();
        const norm2 = text2.toLowerCase().replace(/\s+/g, ' ').trim();
        
        // Calculate Jaccard similarity on words
        const words1 = new Set(norm1.split(' '));
        const words2 = new Set(norm2.split(' '));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        if (union.size === 0) return 1;
        
        const jaccardSimilarity = intersection.size / union.size;
        
        // Calculate length-based similarity
        const lengthSimilarity = Math.min(text1.length, text2.length) / 
                                Math.max(text1.length, text2.length);
        
        // Weighted average
        return (jaccardSimilarity * 0.7 + lengthSimilarity * 0.3);
    }

    /**
     * Calculate similarity between two lines
     */
    calculateLineSimilarity(line1, line2) {
        if (!line1 && !line2) return 1;
        if (!line1 || !line2) return 0;
        
        const words1 = line1.toLowerCase().split(/\s+/);
        const words2 = line2.toLowerCase().split(/\s+/);
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    /**
     * Find conflicts (significant disagreements) in the responses
     */
    findConflicts(lineDiffs) {
        const conflicts = [];
        
        for (const diff of lineDiffs) {
            if (diff.type === 'modified' && diff.similarity < 0.3) {
                // Very different lines - potential conflict
                const conflictType = this.classifyConflict(diff.content1, diff.content2);
                if (conflictType) {
                    conflicts.push({
                        ...diff,
                        conflictType
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * Classify the type of conflict
     */
    classifyConflict(text1, text2) {
        // Check for numeric differences
        const nums1 = text1.match(/\d+(\.\d+)?/g) || [];
        const nums2 = text2.match(/\d+(\.\d+)?/g) || [];
        
        if (nums1.length !== nums2.length) {
            return 'numeric_disagreement';
        }
        
        // Check for boolean/yes-no differences
        const hasYes1 = /\b(yes|true|correct|right)\b/i.test(text1);
        const hasNo1 = /\b(no|false|incorrect|wrong)\b/i.test(text1);
        const hasYes2 = /\b(yes|true|correct|right)\b/i.test(text2);
        const hasNo2 = /\b(no|false|incorrect|wrong)\b/i.test(text2);
        
        if ((hasYes1 && hasNo2) || (hasNo1 && hasYes2)) {
            return 'boolean_disagreement';
        }
        
        // Check for opposite sentiment
        const positive1 = /\b(good|great|excellent|positive|beneficial)\b/i.test(text1);
        const negative1 = /\b(bad|poor|negative|harmful|detrimental)\b/i.test(text1);
        const positive2 = /\b(good|great|excellent|positive|beneficial)\b/i.test(text2);
        const negative2 = /\b(bad|poor|negative|harmful|detrimental)\b/i.test(text2);
        
        if ((positive1 && negative2) || (negative1 && positive2)) {
            return 'sentiment_disagreement';
        }
        
        return null;
    }

    /**
     * Render comparison results as HTML
     */
    renderComparison(comparison, container) {
        // Clear container
        container.innerHTML = '';
        
        // Add header with consensus indicator
        const header = document.createElement('div');
        header.className = 'comparison-header mb-3';
        header.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5>${comparison.model1} vs ${comparison.model2}</h5>
                    <small class="text-muted">
                        Similarity: ${(comparison.similarityScore * 100).toFixed(1)}%
                    </small>
                </div>
                <div>
                    ${comparison.hasConsensus ? 
                        '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Consensus</span>' :
                        '<span class="badge bg-warning"><i class="bi bi-exclamation-triangle"></i> Conflicts</span>'
                    }
                </div>
            </div>
        `;
        container.appendChild(header);
        
        // Add statistics
        const stats = document.createElement('div');
        stats.className = 'comparison-stats mb-3';
        stats.innerHTML = `
            <div class="row text-center">
                <div class="col">
                    <small class="text-muted">Identical</small>
                    <div class="fw-bold text-success">${comparison.stats.identicalLines}</div>
                </div>
                <div class="col">
                    <small class="text-muted">Modified</small>
                    <div class="fw-bold text-warning">${comparison.stats.modifiedLines}</div>
                </div>
                <div class="col">
                    <small class="text-muted">Added</small>
                    <div class="fw-bold text-info">${comparison.stats.addedLines}</div>
                </div>
                <div class="col">
                    <small class="text-muted">Removed</small>
                    <div class="fw-bold text-danger">${comparison.stats.removedLines}</div>
                </div>
            </div>
        `;
        container.appendChild(stats);
        
        // Add toggle for show all vs differences
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'mb-3';
        toggleContainer.innerHTML = `
            <div class="btn-group" role="group">
                <input type="radio" class="btn-check" name="diffMode" id="showAll" 
                       ${this.diffMode === 'all' ? 'checked' : ''}>
                <label class="btn btn-outline-primary btn-sm" for="showAll">Show All</label>
                
                <input type="radio" class="btn-check" name="diffMode" id="showDiff" 
                       ${this.diffMode === 'differences' ? 'checked' : ''}>
                <label class="btn btn-outline-primary btn-sm" for="showDiff">Show Differences Only</label>
            </div>
        `;
        container.appendChild(toggleContainer);
        
        // Add event listeners for toggle
        toggleContainer.querySelector('#showAll').addEventListener('change', () => {
            this.diffMode = 'all';
            this.renderDiffLines(comparison, container.querySelector('.diff-container'));
        });
        
        toggleContainer.querySelector('#showDiff').addEventListener('change', () => {
            this.diffMode = 'differences';
            this.renderDiffLines(comparison, container.querySelector('.diff-container'));
        });
        
        // Add diff container
        const diffContainer = document.createElement('div');
        diffContainer.className = 'diff-container';
        container.appendChild(diffContainer);
        
        // Render diff lines
        this.renderDiffLines(comparison, diffContainer);
    }

    /**
     * Render diff lines
     */
    renderDiffLines(comparison, container) {
        container.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'table table-sm diff-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="45%">${comparison.model1}</th>
                    <th width="5%">#</th>
                    <th width="45%">${comparison.model2}</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        for (const diff of comparison.lineDiffs) {
            // Skip identical lines if in differences mode
            if (this.diffMode === 'differences' && diff.type === 'identical') {
                continue;
            }
            
            const row = document.createElement('tr');
            row.className = `diff-${diff.type}`;
            
            switch (diff.type) {
                case 'identical':
                    row.innerHTML = `
                        <td class="line-num">${diff.lineNum1}</td>
                        <td>${this.escapeHtml(diff.content1)}</td>
                        <td class="line-num">${diff.lineNum2}</td>
                        <td>${this.escapeHtml(diff.content2)}</td>
                    `;
                    break;
                    
                case 'modified':
                    row.innerHTML = `
                        <td class="line-num">${diff.lineNum1}</td>
                        <td class="diff-modified-1">${this.highlightDifferences(diff.content1, diff.content2, 1)}</td>
                        <td class="line-num">${diff.lineNum2}</td>
                        <td class="diff-modified-2">${this.highlightDifferences(diff.content2, diff.content1, 2)}</td>
                    `;
                    break;
                    
                case 'removed':
                    row.innerHTML = `
                        <td class="line-num">${diff.lineNum1}</td>
                        <td class="diff-removed">${this.escapeHtml(diff.content1)}</td>
                        <td class="line-num">-</td>
                        <td class="diff-empty"></td>
                    `;
                    break;
                    
                case 'added':
                    row.innerHTML = `
                        <td class="line-num">-</td>
                        <td class="diff-empty"></td>
                        <td class="line-num">${diff.lineNum2}</td>
                        <td class="diff-added">${this.escapeHtml(diff.content2)}</td>
                    `;
                    break;
            }
            
            tbody.appendChild(row);
        }
        
        container.appendChild(table);
        
        // Add conflicts section if any
        if (comparison.conflicts.length > 0) {
            const conflictsDiv = document.createElement('div');
            conflictsDiv.className = 'conflicts-section mt-4';
            conflictsDiv.innerHTML = `
                <h6><i class="bi bi-exclamation-triangle text-warning"></i> Detected Conflicts</h6>
                <ul class="list-unstyled">
                    ${comparison.conflicts.map(c => `
                        <li class="mb-2">
                            <span class="badge bg-danger">${c.conflictType.replace(/_/g, ' ')}</span>
                            <div class="small">
                                Line ${c.lineNum1}: "${this.escapeHtml(c.content1)}"<br>
                                Line ${c.lineNum2}: "${this.escapeHtml(c.content2)}"
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
            container.appendChild(conflictsDiv);
        }
    }

    /**
     * Highlight word-level differences
     */
    highlightDifferences(text1, text2, version) {
        if (!text1 || !text2) return this.escapeHtml(text1 || '');
        
        const words1 = text1.split(/(\s+)/);
        const words2 = text2.split(/(\s+)/);
        
        let result = '';
        let i = 0;
        
        for (const word of words1) {
            if (/^\s+$/.test(word)) {
                result += word;
                continue;
            }
            
            let found = false;
            for (let j = i; j < words2.length; j++) {
                if (word === words2[j]) {
                    found = true;
                    i = j + 1;
                    break;
                }
            }
            
            if (found) {
                result += this.escapeHtml(word);
            } else {
                result += `<mark class="diff-highlight-${version}">${this.escapeHtml(word)}</mark>`;
            }
        }
        
        return result;
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in main script
window.ComparisonEngine = ComparisonEngine;