// Wait for the entire Document Object Model (DOM) to be fully loaded before executing any script logic
document.addEventListener("DOMContentLoaded", function() {
    // DOM Element References: Store references to various user interface elements for interaction
    const jobCardContainer = document.getElementById("jobContainer"); // Container element for displaying job cards
    const jobApplicationForm = document.getElementById("jobForm"); // Form for adding or editing job applications
    const jobFormModal = document.getElementById("jobModal"); // Modal window for the job application form
    const jobDetailsModal = document.getElementById("detailsModal"); // Modal window for viewing job details
    const modalCloseButtons = document.querySelectorAll(".close-btn"); // Buttons to close modal windows
    const addNewJobButton = document.getElementById("addJobBtn"); // Button to open the job application form
    const jobSearchInput = document.getElementById("search"); // Input field for filtering job applications
    const jobStatusFilter = document.getElementById("statusFilter"); // Dropdown to filter jobs by status
    const jobSortSelection = document.getElementById("sort"); // Dropdown to sort job applications
    const externalJobSearchInput = document.getElementById("jobSearch"); // Input for searching external job listings
    const externalSearchButton = document.getElementById("searchBtn"); // Button to trigger external job search
    const externalSearchResultsContainer = document.getElementById("searchResults"); // Container for external job search results
    const themeToggleButton = document.getElementById("themeToggle"); // Button to toggle between light and dark themes
    const refreshStatisticsButton = document.getElementById("refreshStats"); // Button to refresh application statistics
    const jobTimelineContainer = document.getElementById("timeline"); // Container for displaying recent job timeline
    const previousTabButton = document.getElementById("prevTab"); // Button to navigate to the previous tab
    const nextTabButton = document.getElementById("nextTab"); // Button to navigate to the next tab
    const navigationTabs = document.querySelectorAll(".tab"); // Elements for tab navigation
    const tabContentSections = document.querySelectorAll(".tab-content"); // Content sections corresponding to each tab
    
    // Statistics Display Elements: Elements to show job application statistics
    const totalApplicationsElement = document.getElementById("total-apps"); // Displays total number of applications
    const activeApplicationsElement = document.getElementById("active-apps"); // Displays active applications count
    const interviewStageApplicationsElement = document.getElementById("interview-apps"); // Displays applications in interview stage
    const offerStageApplicationsElement = document.getElementById("offer-apps"); // Displays applications with offers
    
    // Application State: Initialize data and state variables
    let jobApplications = JSON.parse(localStorage.getItem("jobs")) || []; // Load jobs from localStorage or initialize empty array
    let statusVisualizationChart = null; // Chart.js instance for visualizing application status distribution
    let currentActiveTabIndex = 0; // Tracks the currently active tab index for navigation
    
    // Initialize the application by setting up all necessary components
    initializeApplication();
    
    // Main initialization function to set up the application
    function initializeApplication() {
        renderJobApplicationCards(); // Render all job application cards
        updateApplicationStatistics(); // Update the statistics display
        renderRecentApplicationsTimeline(); // Render the timeline of recent applications
        setupAllEventListeners(); // Attach event listeners to interactive elements
        initializeStatusChart(); // Initialize the Chart.js status visualization
        applyThemePreference(); // Apply saved or system-preferred theme
        fetchDefaultJobListings(); // Load default external job listings
    }
    
    // Attach event listeners to all interactive elements
    function setupAllEventListeners() {
        // Open the job application form modal when the "Add Job" button is clicked
        addNewJobButton.addEventListener("click", () => {
            jobFormModal.style.display = "block";
            document.getElementById("jobTitle").focus(); // Set focus to the job title input field
        });
        
        // Close modal windows when any close button is clicked
        modalCloseButtons.forEach(button => button.addEventListener("click", closeAllModals));
        
        // Close modals when clicking outside their content area
        window.addEventListener("click", (event) => {
            if (event.target === jobFormModal) jobFormModal.style.display = "none";
            if (event.target === jobDetailsModal) jobDetailsModal.style.display = "none";
        });
        
        // Handle submission of the job application form
        jobApplicationForm.addEventListener("submit", handleJobFormSubmission);
        
        // Filter and sort job applications when search input, status filter, or sort selection changes
        jobSearchInput.addEventListener("input", debounce(() => renderJobApplicationCards(), 300));
        jobStatusFilter.addEventListener("change", () => renderJobApplicationCards());
        jobSortSelection.addEventListener("change", () => renderJobApplicationCards());
        
        // Trigger external job search when the search button is clicked or Enter key is pressed
        externalSearchButton.addEventListener("click", searchExternalJobListings);
        externalJobSearchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") searchExternalJobListings();
        });
        
        // Toggle between light and dark themes when the theme toggle button is clicked
        themeToggleButton.addEventListener("click", toggleApplicationTheme);
        
        // Refresh statistics and animate them when the refresh button is clicked
        refreshStatisticsButton.addEventListener("click", () => {
            updateApplicationStatistics();
            animateStatisticsDisplay();
        });
        
        // Navigate tabs using previous and next buttons
        previousTabButton.addEventListener("click", () => switchTabNavigation(-1));
        nextTabButton.addEventListener("click", () => switchTabNavigation(1));
        
        // Switch to a specific tab when clicked
        navigationTabs.forEach((tab, index) => {
            tab.addEventListener("click", () => {
                currentActiveTabIndex = index;
                updateTabDisplay();
            });
        });
    }
    
    // Debounce function to limit the frequency of event handler execution
    function debounce(callbackFunction, waitTimeInMs) {
        let timeoutId;
        return function executedCallback(...args) {
            const executeLater = () => {
                clearTimeout(timeoutId);
                callbackFunction(...args);
            };
            clearTimeout(timeoutId);
            timeoutId = setTimeout(executeLater, waitTimeInMs);
        };
    }
    
    // Switch tabs by incrementing or decrementing the current tab index
    function switchTabNavigation(direction) {
        currentActiveTabIndex += direction;
        if (currentActiveTabIndex < 0) currentActiveTabIndex = 0; // Prevent negative tab index
        if (currentActiveTabIndex >= navigationTabs.length) currentActiveTabIndex = navigationTabs.length - 1; // Prevent index overflow
        updateTabDisplay();
    }
    
    // Update the visibility of tabs and their content
    function updateTabDisplay() {
        navigationTabs.forEach((tab, index) => {
            tab.classList.toggle("active", index === currentActiveTabIndex);
        });
        tabContentSections.forEach((content, index) => {
            content.classList.toggle("active", index === currentActiveTabIndex);
        });
    }
    
    // Close all modal windows and reset the form
    function closeAllModals() {
        jobFormModal.style.display = "none";
        jobDetailsModal.style.display = "none";
        currentActiveTabIndex = 0;
        updateTabDisplay();
        jobApplicationForm.reset();
    }
    
    // Handle the submission of the job application form
    async function handleJobFormSubmission(event) {
        event.preventDefault(); // Prevent the default form submission behavior
        
        // Retrieve values from form input fields
        const jobTitleInput = document.getElementById("jobTitle").value.trim();
        const companyNameInput = document.getElementById("company").value.trim();
        const applicationDateInput = document.getElementById("applicationDate").value;
        const jobStatusInput = document.getElementById("status").value;
        const jobPriorityInput = document.getElementById("priority").value;
        const jobPostingUrlInput = document.getElementById("jobUrl").value;
        const jobLocationInput = document.getElementById("location").value;
        const jobSalaryInput = document.getElementById("salary").value;
        const jobNotesInput = document.getElementById("notes").value;
        const interviewDateInput = document.getElementById("interviewDate").value;
        const interviewTypeInput = document.getElementById("interviewType").value;
        const interviewPreparationInput = document.getElementById("interviewPrep").value;
        const interviewFeedbackInput = document.getElementById("interviewFeedback").value;
        
        // Validate required fields (Job Title and Company)
        if (!jobTitleInput || !companyNameInput) {
            displayNotificationMessage("Please fill in required fields (Job Title and Company)", "error");
            return;
        }
        
        // Create a new job application object
        const newJobApplication = {
            id: Date.now().toString(), // Generate a unique ID using current timestamp
            title: jobTitleInput,
            company: companyNameInput,
            date: applicationDateInput || new Date().toISOString().split('T')[0], // Use today's date if none provided
            status: jobStatusInput,
            priority: jobPriorityInput,
            url: jobPostingUrlInput,
            location: jobLocationInput,
            salary: jobSalaryInput,
            notes: jobNotesInput,
            interview: {
                date: interviewDateInput,
                type: interviewTypeInput,
                prep: interviewPreparationInput,
                feedback: interviewFeedbackInput
            },
            createdAt: new Date().toISOString()
        };
        
        // Add the new job application to the array and persist it
        jobApplications.push(newJobApplication);
        saveJobApplications();
        renderJobApplicationCards();
        renderRecentApplicationsTimeline();
        updateApplicationStatistics();
        animateStatisticsDisplay();
        jobApplicationForm.reset();
        jobFormModal.style.display = "none";
        
        displayNotificationMessage("Application added successfully!", "success");
    }
    
    // Persist the job applications array to localStorage
    function saveJobApplications() {
        localStorage.setItem("jobs", JSON.stringify(jobApplications));
    }
    
    // Render job application cards based on current filters and sorting
    function renderJobApplicationCards() {
        const searchQuery = jobSearchInput.value.toLowerCase();
        const selectedStatusFilter = jobStatusFilter.value;
        const selectedSortOption = jobSortSelection.value;
        
        // Filter job applications based on search query and status
        let filteredJobApplications = jobApplications.filter(job => {
            const matchesSearchQuery = job.title.toLowerCase().includes(searchQuery) || 
                                      job.company.toLowerCase().includes(searchQuery) ||
                                      (job.location && job.location.toLowerCase().includes(searchQuery));
            const matchesStatusFilter = selectedStatusFilter === "all" || job.status === selectedStatusFilter;
            return matchesSearchQuery && matchesStatusFilter;
        });
        
        // Sort filtered job applications based on the selected sort option
        filteredJobApplications.sort((jobA, jobB) => {
            switch (selectedSortOption) {
                case "date-asc":
                    return new Date(jobA.date) - new Date(jobB.date);
                case "title":
                    return jobA.title.localeCompare(jobB.title);
                case "company":
                    return jobA.company.localeCompare(jobB.company);
                case "salary":
                    return extractNumericalSalary(jobB) - extractNumericalSalary(jobA);
                default:
                    return new Date(jobB.date) - new Date(jobA.date); // Default to newest first
            }
        });
        
        // Helper function to extract numerical salary for sorting
        function extractNumericalSalary(job) {
            if (!job.salary) return 0;
            const salaryMatch = job.salary.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            return salaryMatch ? parseFloat(salaryMatch[1].replace(/,/g, '')) : 0;
        }
        
        jobCardContainer.innerHTML = "";
        
        // Display a message if no job applications match the filters
        if (filteredJobApplications.length === 0) {
            jobCardContainer.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-briefcase"></i>
                    <h4>No applications tracked yet</h4>
                    <p>Add a new application or browse available jobs below</p>
                    <button class="gradient-btn primary-btn" onclick="document.getElementById('addJobBtn').click()">
                        <i class="fas fa-plus"></i> Add Application
                    </button>
                </div>
            `;
            return;
        }
        
        // Create and append job application cards to the container
        filteredJobApplications.forEach(job => {
            const jobCardElement = document.createElement("div");
            jobCardElement.className = `job-card job-${job.status.toLowerCase()}`;
            jobCardElement.innerHTML = `
                <h3>${job.title}</h3>
                <div class="job-company">${job.company}</div>
                <div class="job-meta">
                    <span class="job-date">${formatDisplayDate(job.date)}</span>
                    <span class="job-status job-${job.status.toLowerCase()}">${job.status}</span>
                </div>
                ${job.priority ? `<div class="job-priority priority-${job.priority.toLowerCase()}">${job.priority} Priority</div>` : ''}
                ${job.location ? `<div class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>` : ''}
                <div class="job-actions">
                    <button class="action-btn view-btn" onclick="viewJobApplicationDetails('${job.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn edit-btn" onclick="editJobApplication('${job.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteJobApplication('${job.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            jobCardContainer.appendChild(jobCardElement);
            
            // Animate the appearance of the job card
            anime({
                targets: jobCardElement,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    }
    
    // Render a timeline of the most recent job applications
    function renderRecentApplicationsTimeline() {
        const recentApplications = [...jobApplications]
            .sort((jobA, jobB) => new Date(jobB.date) - new Date(jobA.date))
            .slice(0, 5); // Select the 5 most recent applications
        
        jobTimelineContainer.innerHTML = "";
        
        // Display a message if there are no recent applications
        if (recentApplications.length === 0) {
            jobTimelineContainer.innerHTML = `<div class="no-timeline">No recent applications to show</div>`;
            return;
        }
        
        // Create and append timeline items
        recentApplications.forEach(job => {
            const timelineItemElement = document.createElement("div");
            timelineItemElement.className = `timeline-item ${job.status.toLowerCase()}`;
            timelineItemElement.innerHTML = `
                <div class="timeline-date">${formatDisplayDate(job.date)}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${job.title}</div>
                    <div class="timeline-company">${job.company}</div>
                    <div class="timeline-status">Status: ${job.status}</div>
                </div>
            `;
            jobTimelineContainer.appendChild(timelineItemElement);
        });
    }
    
    // Format a date string for display purposes
    function formatDisplayDate(dateString) {
        if (!dateString) return "Not specified";
        const dateFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, dateFormatOptions);
    }
    
    // Update the display of application statistics
    function updateApplicationStatistics() {
        totalApplicationsElement.textContent = jobApplications.length;
        activeApplicationsElement.textContent = jobApplications.filter(job => !["Rejected", "Offer"].includes(job.status)).length;
        interviewStageApplicationsElement.textContent = jobApplications.filter(job => job.status === "Interview").length;
        offerStageApplicationsElement.textContent = jobApplications.filter(job => job.status === "Offer").length;
        
        // Update progress bars for statistics
        document.querySelectorAll('.stat-progress').forEach((progressElement, index) => {
            const statisticValues = [
                jobApplications.length,
                jobApplications.filter(job => !["Rejected", "Offer"].includes(job.status)).length,
                jobApplications.filter(job => job.status === "Interview").length,
                jobApplications.filter(job => job.status === "Offer").length
            ];
            const maxStatisticValue = Math.max(...statisticValues.filter(value => !isNaN(value)), 1);
            const progressPercentage = (statisticValues[index] / maxStatisticValue) * 100;
            progressElement.style.setProperty('--progress-width', `${progressPercentage}%`);
        });
        
        updateStatusChart();
    }
    
    // Animate the statistics display for visual feedback
    function animateStatisticsDisplay() {
        anime({
            targets: '.stat',
            scale: [1, 1.05, 1],
            duration: 600,
            easing: 'easeInOutQuad'
        });
        anime({
            targets: '.stat-progress',
            width: (element) => element.style.getPropertyValue('--progress-width'),
            duration: 800,
            easing: 'easeOutQuad'
        });
    }
    
    // Initialize the Chart.js doughnut chart for status visualization
    function initializeStatusChart() {
        const chartContext = document.getElementById('statusChart').getContext('2d');
        statusVisualizationChart = new Chart(chartContext, {
            type: 'doughnut',
            data: prepareChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--dark-text'),
                            font: {
                                family: "'Segoe UI', 'Roboto', sans-serif",
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }
    
    // Update the data in the status chart
    function updateStatusChart() {
        if (statusVisualizationChart) {
            statusVisualizationChart.data = prepareChartData();
            statusVisualizationChart.options.plugins.legend.labels.color = 
                document.body.classList.contains('light-mode') 
                ? 'rgba(0, 0, 0, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)';
            statusVisualizationChart.update();
        }
    }
    
    // Prepare data for the status visualization chart
    function prepareChartData() {
        const statusCountMap = {
            Saved: 0,
            Applied: 0,
            Interview: 0,
            Offer: 0,
            Rejected: 0
        };
        
        jobApplications.forEach(job => {
            statusCountMap[job.status]++;
        });
        
        return {
            labels: Object.keys(statusCountMap),
            datasets: [{
                data: Object.values(statusCountMap),
                backgroundColor: [
                    'rgba(156, 39, 176, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                ],
                borderColor: [
                    'rgba(156, 39, 176, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 20
            }]
        };
    }
    
    // Search for external job listings based on user input
    async function searchExternalJobListings() {
        const searchQuery = externalJobSearchInput.value.trim();
        const searchLocation = document.getElementById("searchLocation").value;
        const searchJobType = document.getElementById("searchType").value;
        
        // Display a loading indicator while fetching job listings
        externalSearchResultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Searching for jobs...</p>
            </div>
        `;
        
        try {
            const jobSearchResults = await fetchExternalJobVacancies(searchQuery, searchLocation, searchJobType);
            displayExternalSearchResults(jobSearchResults);
        } catch (error) {
            displayNotificationMessage("Failed to fetch job listings. Please try again.", "error");
            externalSearchResultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Error fetching jobs</h4>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
    
    // Fetch default job listings to display on initial load
    async function fetchDefaultJobListings() {
        externalSearchResultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Loading featured jobs...</p>
            </div>
        `;
        
        try {
            const defaultJobResults = await fetchExternalJobVacancies("", "", "");
            displayExternalSearchResults(defaultJobResults);
        } catch (error) {
            displayNotificationMessage("Failed to load featured jobs.", "error");
            externalSearchResultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Error loading jobs</h4>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
    
    // Mock API function to fetch external job vacancies
    async function fetchExternalJobVacancies(query, location, type) {
        // Mock job listings data for demonstration purposes
        const mockJobListings = [
            {
                title: "Senior Software Engineer",
                company: "TechTrend Innovations",
                location: "Remote",
                type: "Full-time",
                description: "Lead development of cloud-based applications using React and Node.js.",
                url: "https://example.com/job/123",
                posted: new Date().toISOString(),
                salary: "$120,000 - $160,000"
            },
            {
                title: "Data Scientist",
                company: "Analytics Corp",
                location: "Boston, MA",
                type: "Full-time",
                description: "Analyze large datasets to drive business decisions using Python and ML.",
                url: "https://example.com/job/456",
                posted: new Date(Date.now() - 86400000).toISOString(),
                salary: "$100,000 - $140,000"
            },
            {
                title: "Product Designer",
                company: "CreativeWorks",
                location: "San Francisco, CA",
                type: "Contract",
                description: "Design user-centric interfaces for mobile and web applications.",
                url: "https://example.com/job/789",
                posted: new Date(Date.now() - 172800000).toISOString(),
                salary: "$80,000 - $110,000"
            },
            {
                title: "DevOps Engineer",
                company: "CloudSystems",
                location: "Seattle, WA",
                type: "Full-time",
                description: "Optimize CI/CD pipelines and manage AWS infrastructure.",
                url: "https://example.com/job/101",
                posted: new Date(Date.now() - 259200000).toISOString(),
                salary: "$110,000 - $150,000"
            },
            {
                title: "Marketing Manager",
                company: "BrandBoost",
                location: "New York, NY",
                type: "Full-time",
                description: "Develop and execute digital marketing campaigns.",
                url: "https://example.com/job/112",
                posted: new Date(Date.now() - 345600000).toISOString(),
                salary: "$90,000 - $120,000"
            },
            {
                title: "Backend Developer",
                company: "DataFlow Tech",
                location: "Remote",
                type: "Part-time",
                description: "Build and maintain APIs using Python and Django.",
                url: "https://example.com/job/113",
                posted: new Date(Date.now() - 432000000).toISOString(),
                salary: "$50,000 - $80,000"
            },
            {
                title: "Mobile App Developer",
                company: "AppVenture",
                location: "Austin, TX",
                type: "Full-time",
                description: "Develop iOS and Android applications using Flutter.",
                url: "https://example.com/job/114",
                posted: new Date(Date.now() - 518400000).toISOString(),
                salary: "$95,000 - $130,000"
            }
        ];
        
        // Simulate a network delay for the mock API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filter job listings based on query, location, and job type
        return mockJobListings.filter(job => {
            const matchesSearchQuery = !query || 
                job.title.toLowerCase().includes(query.toLowerCase()) || 
                job.company.toLowerCase().includes(query.toLowerCase()) ||
                job.description.toLowerCase().includes(query.toLowerCase());
            const matchesLocationFilter = !location || 
                job.location.toLowerCase().includes(location.toLowerCase());
            const matchesJobTypeFilter = !type || 
                job.type.toLowerCase().includes(type.toLowerCase());
            return matchesSearchQuery && matchesLocationFilter && matchesJobTypeFilter;
        });
    }
    
    // Display the results of an external job search
    function displayExternalSearchResults(searchResults) {
        externalSearchResultsContainer.innerHTML = "";
        
        // Display a message if no search results are found
        if (searchResults.length === 0) {
            externalSearchResultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>No jobs found</h4>
                    <p>Try different keywords or clear filters</p>
                    <button class="gradient-btn primary-btn" onclick="fetchDefaultJobListings()">
                        <i class="fas fa-sync"></i> Show Featured Jobs
                    </button>
                </div>
            `;
            return;
        }
        
        // Render search results with action buttons
        externalSearchResultsContainer.innerHTML = `
            <div class="search-header">
                <h3>Available Jobs (${searchResults.length})</h3>
                <button class="gradient-btn secondary-btn" onclick="fetchDefaultJobListings()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            ${searchResults.map(job => `
                <div class="search-result">
                    <h4>${job.title}</h4>
                    <div class="result-meta">
                        <span class="company">${job.company}</span>
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span class="type"><i class="fas fa-clock"></i> ${job.type}</span>
                        <span class="posted"><i class="fas fa-calendar"></i> Posted ${formatDisplayDate(job.posted)}</span>
                        ${job.salary ? `<span class="salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>` : ''}
                    </div>
                    <p class="description">${job.description}</p>
                    <div class="result-actions">
                        <button class="gradient-btn primary-btn small-btn" onclick="addJobApplicationFromSearch('${job.title.replace(/'/g, "\\'")}', '${job.company.replace(/'/g, "\\'")}', '${job.location.replace(/'/g, "\\'")}', '${job.url.replace(/'/g, "\\'")}', '${job.salary ? job.salary.replace(/'/g, "\\'") : ''}')">
                            <i class="fas fa-plus"></i> Track Application
                        </button>
                        <a href="${job.url}" target="_blank" class="secondary-btn small-btn">
                            <i class="fas fa-external-link-alt"></i> View Job
                        </a>
                    </div>
                </div>
            `).join("")}
        `;
        
        // Animate the appearance of search result cards
        anime({
            targets: '.search-result',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });
    }
    
    // Display a notification message to the user
    function displayNotificationMessage(messageText, messageType) {
        const notificationElement = document.createElement("div");
        notificationElement.className = `notification ${messageType}`;
        notificationElement.innerHTML = `
            <i class="fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${messageText}
        `;
        document.body.appendChild(notificationElement);
        
        // Animate the notification's appearance and disappearance
        setTimeout(() => {
            notificationElement.classList.add("show");
            setTimeout(() => {
                notificationElement.classList.remove("show");
                setTimeout(() => {
                    document.body.removeChild(notificationElement);
                }, 300);
            }, 3000);
        }, 10);
    }
    
    // Toggle between light and dark themes
    function toggleApplicationTheme() {
        document.body.classList.toggle("light-mode");
        const isLightModeActive = document.body.classList.contains("light-mode");
        localStorage.setItem("theme", isLightModeActive ? "light" : "dark");
        themeToggleButton.innerHTML = isLightModeActive ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
        updateStatusChart();
    }
    
    // Apply the saved or system-preferred theme
    function applyThemePreference() {
        const savedThemePreference = localStorage.getItem("theme") || 
                                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark");
        if (savedThemePreference === "light") {
            document.body.classList.add("light-mode");
            themeToggleButton.innerHTML = `<i class="fas fa-sun"></i>`;
        } else {
            themeToggleButton.innerHTML = `<i class="fas fa-moon"></i>`;
        }
    }
    
    // View detailed information about a job application
    window.viewJobApplicationDetails = function(applicationId) {
        const selectedJob = jobApplications.find(job => job.id === applicationId);
        if (!selectedJob) return;
        
        const detailsContentContainer = document.getElementById("jobDetailsContent");
        detailsContentContainer.innerHTML = `
            <h2>${selectedJob.title}</h2>
            <div class="detail-row">
                <div class="detail-label">Company</div>
                <div class="detail-value">${selectedJob.company}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Application Date</div>
                <div class="detail-value">${formatDisplayDate(selectedJob.date)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="job-status job-${selectedJob.status.toLowerCase()}">${selectedJob.status}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Priority</div>
                <div class="detail-value"><span class="job-priority priority-${selectedJob.priority.toLowerCase()}">${selectedJob.priority}</span></div>
            </div>
            ${selectedJob.location ? `
            <div class="detail-row">
                <div class="detail-label">Location</div>
                <div class="detail-value"><i class="fas fa-map-marker-alt"></i> ${selectedJob.location}</div>
            </div>
            ` : ''}
            ${selectedJob.salary ? `
            <div class="detail-row">
                <div class="detail-label">Salary Range</div>
                <div class="detail-value"><i class="fas fa-dollar-sign"></i> ${selectedJob.salary}</div>
            </div>
            ` : ''}
            ${selectedJob.url ? `
            <div class="detail-row">
                <div class="detail-label">Job Posting</div>
                <div class="detail-value"><a href="${selectedJob.url}" target="_blank"><i class="fas fa-external-link-alt"></i> View Original Posting</a></div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${selectedJob.notes || "No notes added"}</div>
            </div>
            ${selectedJob.interview.date || selectedJob.interview.type ? `
            <div class="detail-section">
                <h3><i class="fas fa-calendar-alt"></i> Interview Details</h3>
                ${selectedJob.interview.date ? `
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formatDateTimeDisplay(selectedJob.interview.date)}</div>
                </div>
                ` : ''}
                ${selectedJob.interview.type ? `
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${selectedJob.interview.type}</div>
                </div>
                ` : ''}
                ${selectedJob.interview.prep ? `
                <div class="detail-row">
                    <div class="detail-label">Preparation Notes</div>
                    <div class="detail-value">${selectedJob.interview.prep}</div>
                </div>
                ` : ''}
                ${selectedJob.interview.feedback ? `
                <div class="detail-row">
                    <div class="detail-label">Feedback</div>
                    <div class="detail-value">${selectedJob.interview.feedback}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            <div class="detail-actions">
                <button class="gradient-btn primary-btn" onclick="editJobApplication('${selectedJob.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="secondary-btn" onclick="deleteJobApplication('${selectedJob.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        jobDetailsModal.style.display = "block";
        
        // Animate the modal's appearance
        anime({
            targets: jobDetailsModal,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    };
    
    // Format a datetime string for display
    function formatDateTimeDisplay(dateTimeString) {
        if (!dateTimeString) return "";
        const dateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeString).toLocaleDateString(undefined, dateTimeFormatOptions);
    }
    
    // Edit an existing job application by pre-filling the form
    window.editJobApplication = function(jobId) {
        const selectedJob = jobApplications.find(job => j.id === jobId');
        if (!selectedJob) return;
        
        // Pre-fill the form with the selected job's details
        document.getElementById("jobTitle").value = selectedJob.title;
        document.getElementById("company").value = selectedJob.company;
        document.getElementById("applicationDate").value = selectedJob.date;
        document.getElementById("status").value = selectedJob.status;
        document.getElementById("priority").value = selectedJob.priority;
        document.getElementById("jobUrl").value = selectedJob.url || "";
        document.getElementById("location").value = selectedJob.location || "";
        document.getElementById("salary").value = selectedJob.salary || "";
        document.getElementById("notes").value = selectedJob.notes || "";
        document.getElementById("interviewDate").value = selectedJob.interview.date || "";
        document.getElementById("interviewType").value = selectedJob.interview.type || "";
        document.getElementById("interviewPrep").value = selectedJob.interview.prep || "";
        document.getElementById("interviewFeedback").value = selectedJob.interview.feedback || "";
        
        // Remove the job application from the array (it will be re-added on form submission)
        jobApplications = jobApplications.filter(job => job.id !== jobId);
        
        jobFormModal.style.display = "block";
        jobDetailsModal.style.display = "none";
    };
    
    // Delete a job application after user confirmation
    window.deleteJobApplication = function(applicationId) {
        if (confirm("Are you sure you want to delete this application?")) {
            jobApplications = jobApplications.filter(job => job.id !== applicationId);
            saveJobApplications();
            renderJobApplicationCards();
            renderRecentApplicationsTimeline();
            updateApplicationStatistics();
            closeAllModals();
            displayNotificationMessage("Application deleted", "error");
        }
    };
    
    // Pre-fill the job application form with data from a search result
    window.addJobApplicationFromSearch = function(title, company, location = "", url = "", salary = "") {
        document.getElementById("jobTitle").value = title;
        document.getElementById("company").value = company;
        if (location) {
            document.getElementById("location").value = location;
        }
        if (url) {
            document.getElementById("jobUrl").value = url;
        }
        if (salary) {
            document.getElementById("salary").value = salary;
        }
        jobFormModal.style.display = "block";
        externalJobSearchInput.value = "";
    }
});

// Inject enhanced CSS styles into the document
const styleElement = document.createElement('style');
styleElement.textContent = `
/* Styles for notification messages */
.notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.95); /* Success notification background */
    color: white;
    padding: 15px 25px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    opacity: 0;
    transition: all 0.3s ease;
}

.notification.error {
    background: rgba(244, 67, 54, 0.95); /* Error notification background */
}

.notification.show {
    opacity: 1;
    bottom: 30px; /* Slide up when shown */
}

/* Styles for search results header */
.search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px;
    background: var(--card-bg);
    border-radius: 8px;
}

/* Styles for individual search result cards */
.search-result {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-result:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Hover effect */
}

/* Metadata for search results */
.result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin: 10px 0;
    font-size: 0.9em;
    color: var(--dark-text-secondary);
}

.result-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Loading spinner animation */
.loading-spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 4px solid var(--dark-primary);
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Styles for loading indicator */
.job-search-results-loading {
    display: flex;
    flex-direction: center;
    align-items: center;
    padding: 20px;
    color: var(--dark-text-secondary);
    background: var(--card-bg);
    border-radius: 8px;
}

/* Styles for no results message */
.no-job-results {
    display: flex;
    flex-direction: center;
    justify-content: center;
    align-items: center;
    padding: 30px;
    background: var(--card-bg);
    border-radius: 8px;
}

.no-job-results button {
    margin-top: 10px;
}

/* Light mode adjustments */
@media (prefers-color-scheme: light) {
    body.light-mode .job-search-results-loading,
    body.light-mode .no-results {
        color: var(--light-text-secondary);
    }
}

/* Styles for job application cards */
.job-application-card {
    position: relative;
    overflow: hidden;
    background: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s ease;
}

.job-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15); /* Hover effect */
}

/* Delete button styles */
.delete-btn {
    background: #ff4444;
    color: white;
    background-color: white;
    transition: background 0.2s ease;
}

.delete-btn:hover {
    background: #cc0000; /* Darker red on hover */
}

/* Job metadata styles */
.job-meta-data {
    display: flex;
    gap: 15px;
    margin: 10px 0;
}

/* Job action buttons */
.job-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

/* General action button styles */
.action-btn {
    padding: 8px 15px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
}
`;
document.head.appendChild(styleElement);
