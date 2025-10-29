// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('sebplcLoggedIn');
    if (isLoggedIn === 'true') {
        // User is logged in, show dashboard
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.querySelector('.dashboard-content').style.display = 'block';
        
        // Load data from CSV
        loadCSVData();
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkLoginStatus);

// Login functionality
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const errorAlert = document.getElementById('login-error');
    
    // Check credentials
    if (username === 'admin' && password === 'Sebplc@1234') {
        // Store login status in localStorage
        if (rememberMe) {
            localStorage.setItem('sebplcLoggedIn', 'true');
        } else {
            // Use sessionStorage for temporary login (cleared when browser closes)
            sessionStorage.setItem('sebplcLoggedIn', 'true');
        }
        
        // Hide login, show dashboard
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.querySelector('.dashboard-content').style.display = 'block';
        
        // Load data from CSV
        loadCSVData();
    } else {
        errorAlert.style.display = 'block';
    }
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    
    // Clear login status from storage
    localStorage.removeItem('sebplcLoggedIn');
    sessionStorage.removeItem('sebplcLoggedIn');
    
    // Show login form, hide dashboard
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
});

// CSV URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnBczg6Ag3T0GwwKZbNqlbKVE_5rccgCU_CfBdaOYhOX_UIb2nP4qYgk7hA-xUx2ww85ld8ju2MUvf/pub?gid=0&single=true&output=csv';

// Global variable to store the data
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// Function to load CSV data
async function loadCSVData() {
    const loadingAlert = document.getElementById('loading-data');
    loadingAlert.style.display = 'block';
    
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        
        // Parse CSV data
        allData = parseCSV(csvText);
        
        // Sort by timestamp (newest first)
        allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Update total applications count
        document.getElementById('total-applications').textContent = allData.length;
        
        // Set filtered data to all data initially
        filteredData = [...allData];
        
        // Load the first page
        loadTablePage(1);
        
        loadingAlert.style.display = 'none';
    } catch (error) {
        console.error('Error loading CSV data:', error);
        loadingAlert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading data. Please try again later.';
    }
}

// Refresh button functionality
document.getElementById('refresh-btn').addEventListener('click', function() {
    const refreshBtn = this;
    
    // Add refreshing animation
    refreshBtn.classList.add('refreshing');
    
    // Load fresh data
    loadCSVData().then(() => {
        // Remove animation after a short delay
        setTimeout(() => {
            refreshBtn.classList.remove('refreshing');
        }, 500);
    });
});

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    // Skip header row if it exists
    const startIndex = lines[0].toLowerCase().includes('timestamp') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Simple CSV parsing - this may need adjustment based on your actual CSV format
            const values = parseCSVLine(line);
            
            if (values.length >= 5) {
                result.push({
                    timestamp: values[0],
                    fullName: values[1],
                    contact: values[2],
                    fileName: values[3],
                    fileLink: values[4]
                });
            }
        }
    }
    
    return result;
}

// Helper function to parse a CSV line
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Function to load a specific page of data
function loadTablePage(page) {
    currentPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    
    if (pageData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">No data found</td>`;
        tableBody.appendChild(row);
    } else {
        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.timestamp}</td>
                <td>${item.fullName}</td>
                <td>${item.contact}</td>
                <td>${item.fileName}</td>
                <td><a href="${item.fileLink}" class="file-link" target="_blank">View File</a></td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update pagination info
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    document.getElementById('pagination-info').textContent = 
        `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredData.length)} of ${filteredData.length} entries`;
    
    // Update pagination buttons
    updatePaginationButtons(totalPages);
}

// Function to update pagination buttons
function updatePaginationButtons(totalPages) {
    const paginationButtons = document.querySelector('.pagination-buttons');
    
    // Clear existing buttons (except prev and next)
    paginationButtons.innerHTML = '';
    
    // Add previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.id = 'prev-btn';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadTablePage(currentPage - 1);
        }
    });
    paginationButtons.appendChild(prevBtn);
    
    // Add page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            loadTablePage(i);
        });
        paginationButtons.appendChild(pageBtn);
    }
    
    // Add next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.id = 'next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadTablePage(currentPage + 1);
        }
    });
    paginationButtons.appendChild(nextBtn);
}

// Search functionality
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(item => 
            item.timestamp.toLowerCase().includes(searchTerm) ||
            item.fullName.toLowerCase().includes(searchTerm) ||
            item.contact.toLowerCase().includes(searchTerm) ||
            item.fileName.toLowerCase().includes(searchTerm) ||
            item.fileLink.toLowerCase().includes(searchTerm)
        );
    }
    
    // Reset to first page after search
    loadTablePage(1);
    
    // Update total applications count for filtered results
    document.getElementById('total-applications').textContent = filteredData.length;
});

// Filter buttons functionality
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        this.classList.add('active');
        
        const filterType = this.getAttribute('data-filter');
        
        // Apply sorting based on filter type
        if (filterType === 'timestamp') {
            filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (filterType === 'filename') {
            filteredData.sort((a, b) => a.fileName.localeCompare(b.fileName));
        } else {
            // Default: newest first
            filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Reload the table with sorted data
        loadTablePage(1);
    });
});
