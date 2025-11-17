// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('sebplcLoggedIn');
    if (isLoggedIn === 'true') {
        // User is logged in, show dashboard
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
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
    const errorAlert = document.getElementById('login-error');
    
    // Check credentials
    if (username === 'admin' && password === 'Sebplc@1234') {
        // Store login status in localStorage
        localStorage.setItem('sebplcLoggedIn', 'true');
        
        // Hide login, show dashboard
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
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
    
    // Show login form, hide dashboard
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
});

// Navigation functionality
document.querySelectorAll('.nav-links a[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.remove('active');
        });
        
        // Add active class to clicked link
        this.classList.add('active');
        
        // Get the section to show
        const section = this.getAttribute('data-section');
        
        // Hide all sections
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('analytics-section').style.display = 'none';
        document.getElementById('downloads-section').style.display = 'none';
        
        // Show the selected section
        document.getElementById(`${section}-section`).style.display = 'block';
        
        // If analytics section is selected, render the chart
        if (section === 'analytics' && allData.length > 0) {
            renderApplicationsChart();
        }
    });
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
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${CSV_URL}&t=${timestamp}`);
        const csvText = await response.text();
        
        // Parse CSV data
        allData = parseCSV(csvText);
        
        // Sort by timestamp (newest first)
        allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Update stats
        updateStats();
        
        // Set filtered data to all data initially
        filteredData = [...allData];
        
        // Load the first page
        loadTablePage(1);
        
        loadingAlert.style.display = 'none';
        
        // Render chart if on analytics page
        if (document.getElementById('analytics-section').style.display === 'block') {
            renderApplicationsChart();
        }
    } catch (error) {
        console.error('Error loading CSV data:', error);
        loadingAlert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading data. Please try again later.';
    }
}

// Function to update statistics
function updateStats() {
    const totalApplications = allData.length;
    document.getElementById('total-applications').textContent = totalApplications;
    
    // Calculate today's applications
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayApplications = allData.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        return itemDate === todayStr;
    }).length;
    document.getElementById('today-applications').textContent = todayApplications;
    
    // Calculate this week's applications
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekApplications = allData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= weekAgo;
    }).length;
    document.getElementById('week-applications').textContent = weekApplications;
}

// Refresh button functionality - now reloads the page
document.getElementById('refresh-btn').addEventListener('click', function() {
    location.reload();
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

// Function to convert download link to view link
function convertToViewLink(downloadLink) {
    // Extract file ID from Google Drive download link
    const match = downloadLink.match(/[&?]id=([^&]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return downloadLink; // Return original if pattern doesn't match
}

// Function to show PDF in modal
function showPDFModal(pdfUrl) {
    const modal = document.getElementById('pdf-modal');
    const viewLink = convertToViewLink(pdfUrl);
    document.getElementById('pdf-viewer').src = viewLink;
    modal.style.display = 'block';
}

// Function to download file
function downloadFile(downloadLink, fileName) {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = fileName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <td>
                    <div class="file-actions">
                        <button class="view-btn" data-filelink="${item.fileLink}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="download-btn" 
                                data-filelink="${item.fileLink}" 
                                data-filename="${item.fileName}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const fileLink = this.getAttribute('data-filelink');
                showPDFModal(fileLink);
            });
        });
        
        // Add event listeners to download buttons
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', function() {
                const fileLink = this.getAttribute('data-filelink');
                const fileName = this.getAttribute('data-filename');
                downloadFile(fileLink, fileName);
            });
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

// Close modal functionality
document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('pdf-modal').style.display = 'none';
    document.getElementById('pdf-viewer').src = '';
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('pdf-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
        document.getElementById('pdf-viewer').src = '';
    }
});

// Function to render applications chart
function renderApplicationsChart() {
    const ctx = document.getElementById('applications-chart').getContext('2d');
    
    // Group applications by day
    const applicationsByDay = {};
    allData.forEach(item => {
        const date = new Date(item.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!applicationsByDay[dateStr]) {
            applicationsByDay[dateStr] = 0;
        }
        applicationsByDay[dateStr]++;
    });
    
    // Get the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
    }
    
    // Prepare chart data
    const labels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = last7Days.map(date => applicationsByDay[date] || 0);
    
    // Create the chart
    if (window.applicationsChart) {
        window.applicationsChart.destroy();
    }
    
    window.applicationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Applications',
                data: data,
                backgroundColor: 'rgba(185, 44, 146, 0.7)',
                borderColor: 'rgba(185, 44, 146, 1)',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Applications by Day',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Download all ZIP functionality
document.getElementById('download-all-zip').addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.innerHTML;
    
    // Show loading state
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing ZIP...';
    btn.disabled = true;
    
    try {
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // Add all files to the zip
        for (let i = 0; i < allData.length; i++) {
            const item = allData[i];
            
            try {
                // Fetch the file
                const response = await fetch(item.fileLink);
                const blob = await response.blob();
                
                // Add file to zip with original filename
                zip.file(item.fileName, blob);
            } catch (error) {
                console.error(`Error fetching file ${item.fileName}:`, error);
            }
        }
        
        // Generate the zip file
        const zipBlob = await zip.generateAsync({type: 'blob'});
        
        // Download the zip file
        saveAs(zipBlob, `applications-${new Date().toISOString().split('T')[0]}.zip`);
        
        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Error creating ZIP file. Please try again.');
        
        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});