// DOM Elements
const contentElement = document.getElementById('content');
const recentChangesList = document.getElementById('recentChanges');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const mainNav = document.getElementById('mainNav');
const quickLinks = document.getElementById('quickLinks');

// Application state
let currentPage = 'home';
let data = {};
let availablePages = [];
let recentChanges = [];

// Format a string to title case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }).replace(/-/g, ' ');
}

// Get page ID from filename
function getPageId(filename) {
    return filename.replace('.json', '').replace(/[^a-zA-Z0-9-]/g, '');
}

// Format page ID for display
function formatPageId(pageId) {
    return toTitleCase(pageId.replace(/-/g, ' '));
}

// Load all available pages from the Data directory
async function loadAvailablePages() {
    try {
        const response = await fetch('Data/');
        if (!response.ok) throw new Error('Failed to load data directory');
        
        // Parse the directory listing (this requires server-side support)
        // For now, we'll use a list of known files
        const dataFiles = [
            'artificial-intelligence.json',
            'quantum-computing.json',
            'blockchain-technology.json',
            'augmented-reality.json',
            'internet-of-things.json',
            '5g-technology.json',
            'machine-learning.json',
            'cloud-computing.json',
            'cybersecurity.json',
            'edge-computing.json'
        ];
        
        availablePages = dataFiles.map(file => ({
            id: getPageId(file),
            filename: file,
            title: formatPageId(getPageId(file))
        }));
        
        // Update navigation
        updateNavigation();
        
        // Set up recent changes
        recentChanges = [
            `New article on ${availablePages[0].title}`,
            `Updated ${availablePages[1].title} section`,
            `Fixed typos in ${availablePages[2].title} article`
        ];
        
        return true;
    } catch (error) {
        console.error('Error loading available pages:', error);
        return false;
    }
}

// Update navigation menu
function updateNavigation() {
    // Clear existing navigation items (except Home)
    while (mainNav.children.length > 1) {
        mainNav.removeChild(mainNav.lastChild);
    }
    
    // Clear quick links
    quickLinks.innerHTML = '';
    
    // Add navigation items and quick links
    availablePages.forEach(page => {
        // Add to main navigation
        const navItem = document.createElement('li');
        navItem.innerHTML = `<a href="#" data-page="${page.id}">${page.title}</a>`;
        mainNav.appendChild(navItem);
        
        // Add to quick links (limited to 5)
        if (quickLinks.children.length < 5) {
            const quickLink = document.createElement('li');
            quickLink.innerHTML = `<a href="#" data-page="${page.id}">${page.title}</a>`;
            quickLinks.appendChild(quickLink);
        }
    });
    
    // Update event listeners for navigation
    setupEventListeners();
}

// Initialize the application
async function init() {
    try {
        // Load available pages first
        const pagesLoaded = await loadAvailablePages();
        
        if (!pagesLoaded) {
            throw new Error('Failed to load page list');
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Load the home page by default
        loadPage('home');
    } catch (error) {
        console.error('Error initializing application:', error);
        contentElement.innerHTML = `
            <div class="error-message">
                <h1>Error Loading Content</h1>
                <p>Sorry, we encountered an error while loading the content. Please try again later.</p>
                <p><em>${error.message}</em></p>
                <button onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Navigation links (delegated event listener)
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('a[data-page]');
        if (navLink) {
            e.preventDefault();
            const page = navLink.getAttribute('data-page');
            if (page) {
                loadPage(page);
                // Update active state
                document.querySelectorAll('a[data-page]').forEach(link => {
                    link.classList.toggle('active', link === navLink);
                });
            }
        }
    });
    
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// Load a page by its ID
async function loadPage(pageId) {
    currentPage = pageId;
    
    // Show loading state
    contentElement.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading content...</p>
        </div>
    `;
    
    try {
        let pageData;
        
        if (pageId === 'home') {
            // Render home page
            pageData = {
                title: 'Welcome to LearnHub',
                content: 'Explore our collection of technology articles and resources. Select a topic from the navigation menu to get started.',
                recentChanges: recentChanges
            };
            renderPage(pageData);
            updateRecentChanges(recentChanges);
            return;
        }
        
        // Load page data from JSON file
        const pageInfo = availablePages.find(p => p.id === pageId);
        if (!pageInfo) {
            throw new Error('Page not found');
        }
        
        const response = await fetch(`Data/${pageInfo.filename}`);
        if (!response.ok) throw new Error('Failed to load page data');
        
        pageData = await response.json();
        
        // Update the URL without reloading the page
        history.pushState({ page: pageId }, '', `#${pageId}`);
        
        // Render the page content
        renderPage(pageData);
        
    } catch (error) {
        console.error('Error loading page:', error);
        contentElement.innerHTML = `
            <div class="error-message">
                <h1>Error Loading Page</h1>
                <p>Sorry, we couldn't load the requested page. The content may not be available at this time.</p>
                <p><em>${error.message}</em></p>
                <button onclick="loadPage('home')">Return to Home</button>
            </div>
        `;
    }
}

// Render page content
function renderPage(pageData) {
    if (!pageData) return;
    
    let contentHTML = `
        <h1>${pageData.title}</h1>
        ${pageData.introduction ? `<p class="introduction">${pageData.introduction}</p>` : ''}
    `;
    
    // Add sections if available
    if (pageData.sections && Array.isArray(pageData.sections)) {
        pageData.sections.forEach(section => {
            if (section.title && section.content) {
                contentHTML += `
                    <section class="content-section">
                        <h2>${section.title}</h2>
                        <div class="section-content">
                            ${section.content.split('\n').map(paragraph => 
                                paragraph.trim() ? `<p>${paragraph}</p>` : ''
                            ).join('')}
                        </div>
                    </section>
                `;
            }
        });
    }
    
    // Add key terms if available
    if (pageData.keyTerms || pageData.keyConcepts) {
        const terms = pageData.keyTerms || pageData.keyConcepts || [];
        if (terms.length > 0) {
            contentHTML += `
                <section class="key-terms">
                    <h2>Key ${pageData.keyTerms ? 'Terms' : 'Concepts'}</h2>
                    <div class="terms-grid">
                        ${terms.map(term => `<span class="term-tag">${term}</span>`).join('')}
                    </div>
                </section>
            `;
        }
    }
    
    // Add related topics if available
    const relatedTopics = [
        ...(pageData.relatedFields || []),
        ...(pageData.notablePlatforms || []),
        ...(pageData.majorProviders || [])
    ];
    
    if (relatedTopics.length > 0) {
        contentHTML += `
            <section class="related-topics">
                <h2>Related Topics</h2>
                <div class="topics-grid">
                    ${relatedTopics.map(topic => {
                        const topicId = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const pageExists = availablePages.some(p => p.id === topicId);
                        return pageExists 
                            ? `<a href="#" data-page="${topicId}" class="topic-tag">${topic}</a>`
                            : `<span class="topic-tag disabled">${topic}</span>`;
                    }).join('')}
                </div>
            </section>
        `;
    }
    
    contentElement.innerHTML = contentHTML;
}

// Update recent changes list
function updateRecentChanges(changes) {
    if (!recentChangesList) return;
    
    recentChangesList.innerHTML = changes
        .map(change => `<li>${change}</li>`)
        .join('');
}

// Handle search functionality
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    
    // Show loading state
    contentElement.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching for "${query}"...</p>
        </div>
    `;
    
    // Simulate search delay for better UX
    setTimeout(() => {
        performSearch(query);
    }, 300);
}

// Perform the actual search
async function performSearch(query) {
    try {
        // First check page titles
        const matchingPages = availablePages.filter(page => 
            page.title.toLowerCase().includes(query) ||
            page.id.toLowerCase().includes(query)
        );
        
        // If we found exact matches, load the first one
        if (matchingPages.length > 0) {
            loadPage(matchingPages[0].id);
            return;
        }
        
        // Otherwise, search within content (this is simplified - in a real app, you'd want to index the content)
        let contentMatch = null;
        
        // Limit to first 5 pages to avoid too many requests
        const searchLimit = Math.min(5, availablePages.length);
        
        for (let i = 0; i < searchLimit; i++) {
            const page = availablePages[i];
            try {
                const response = await fetch(`Data/${page.filename}`);
                if (response.ok) {
                    const pageData = await response.json();
                    const content = JSON.stringify(pageData).toLowerCase();
                    if (content.includes(query)) {
                        contentMatch = page.id;
                        break;
                    }
                }
            } catch (error) {
                console.error(`Error searching in ${page.filename}:`, error);
            }
        }
        
        if (contentMatch) {
            loadPage(contentMatch);
        } else {
            showNoResults(query);
        }
    } catch (error) {
        console.error('Search error:', error);
        showNoResults(query);
    }
}

// Show no results message
function showNoResults(query) {
    contentElement.innerHTML = `
        <div class="no-results">
            <h1>No Results Found</h1>
            <p>We couldn't find any results for "${query}".</p>
            <p>Try different keywords or check out our <a href="#" data-page="home">home page</a>.</p>
            <div class="suggested-searches">
                <h3>Popular Searches:</h3>
                <div class="suggestions">
                    ${availablePages.slice(0, 4).map(page => 
                        `<a href="#" data-page="${page.id}" class="suggestion-tag">${page.title}</a>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const page = (event.state && event.state.page) || 'home';
    loadPage(page);
    
    // Update active state in navigation
    document.querySelectorAll('a[data-page]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
});

// Handle initial page load with hash
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        loadPage(hash);
    }
});

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
