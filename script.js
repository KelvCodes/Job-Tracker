
        searchInput.addEventListener("input", debounce(() => renderJobs(), 300));
        statusFilter.addEventListener("change", () => renderJobs());
        sortSelect.addEventListener("change", () => renderJobs());
        
        // Job search
        searchBtn.addEventListener("click", searchJobs);
        jobSearch.addEventListener("keypress", (e) => {
            if (e.key === "Enter") searchJobs();
        });
        
        // Theme toggle
        themeToggle.addEventListener("click", toggleTheme);
        
        // Refresh stats
        refreshStats.addEventListener("click", () => {
            updateStats();
            animateStats();
        });
        
        // Tab navigation
        prevTabBtn.addEventListener("click", () => switchTab(-1));
        nextTabBtn.addEventListener("click", () => switchTab(1));
        
        // Tab clicks
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => {
                currentTab = index;
                updateTabs();
            });
        });
    }
    
    // Debounce function to limit rapid event firing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function switchTab(direction) {
        currentTab += direction;
        if (currentTab < 0) currentTab = 0;
        if (currentTab >= tabs.length) currentTab = tabs.length - 1;
        updateTabs();
    }
    
    function updateTabs() {
        tabs.forEach((tab, index) => {
            tab.classList.toggle("active", index === currentTab);
        });
        
        tabContents.forEach((content, index) => {
            content.classList.toggle("active", index === currentTab);
        });
    }
    
    function closeModals() {
        jobModal.style.display = "none";
        detailsModal.style.display = "none";
        currentTab = 0;
        updateTabs();
        jobForm.reset();
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const jobTitle = document.getElementById("jobTitle").value.trim();
        const company = document.getElementById("company").value.trim();
        const applicationDate = document.getElementById("applicationDate").value;
        const status = document.getElementById("status").value;
        const priority = document.getElementById("priority").value;
        const jobUrl = document.getElementById("jobUrl").value;
        const location = document.getElementById("location").value;
        const salary = document.getElementById("salary").value;
        const notes = document.getElementById("notes").value;
        const interviewDate = document.getElementById("interviewDate").value;
        const interviewType = document.getElementById("interviewType").value;
        const interviewPrep = document.getElementById("interviewPrep").value;
        const interviewFeedback = document.getElementById("interviewFeedback").value;
        
        if (!jobTitle || !company) {
            showNotification("Please fill in required fields (Job Title and Company)", "error");
            return;
        }
        
        const newJob = {
            id: Date.now().toString(),
            title: jobTitle,
            company: company,
            date: applicationDate || new Date().toISOString().split('T')[0],
            status: status,
            priority: priority,
            url: jobUrl,
            location: location,
            salary: salary,
            notes: notes,
            interview: {
                date: interviewDate,
                type: interviewType,
                prep: interviewPrep,
                feedback: interviewFeedback
            },
            createdAt: new Date().toISOString()
        };
        
        jobs.push(newJob);
        saveJobs();
        renderJobs();
        renderTimeline();
        updateStats();
        animateStats();
        jobForm.reset();
        jobModal.style.display = "none";
        
        showNotification("Application added successfully!", "success");
    }
    
    function saveJobs() {
        localStorage.setItem("jobs", JSON.stringify(jobs));
    }
    
    function renderJobs() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilterValue = statusFilter.value;
        const sortValue = sortSelect.value;
        
        let filteredJobs = jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm) || 
                                job.company.toLowerCase().includes(searchTerm) ||
                                (job.location && job.location.toLowerCase().includes(searchTerm));
            const matchesStatus = statusFilterValue === "all" || job.status === statusFilterValue;
            return matchesSearch && matchesStatus;
        });
        
        filteredJobs.sort((a, b) => {
            switch (sortValue) {
                case "date-asc":
                    return new Date(a.date) - new Date(b.date);
                case "title":
                    return a.title.localeCompare(b.title);
                case "company":
                    return a.company.localeCompare(b.company);
                case "salary":
                    return extractSalary(b) - extractSalary(a);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
        
        function extractSalary(job) {
            if (!job.salary) return 0;
            const match = job.salary.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        }
        
        jobContainer.innerHTML = "";
        
        if (filteredJobs.length === 0) {
            jobContainer.innerHTML = `
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
        
        filteredJobs.forEach(job => {
            const jobCard = document.createElement("div");
            jobCard.className = `job-card job-${job.status.toLowerCase()}`;
            jobCard.innerHTML = `
                <h3>${job.title}</h3>
                <div class="job-company">${job.company}</div>
                <div class="job-meta">
                    <span class="job-date">${formatDate(job.date)}</span>
                    <span class="job-status job-${job.status.toLowerCase()}">${job.status}</span>
                </div>
                ${job.priority ? `<div class="job-priority priority-${job.priority.toLowerCase()}">${job.priority} Priority</div>` : ''}
                ${job.location ? `<div class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>` : ''}
                <div class="job-actions">
                    <button class="action-btn view-btn" onclick="viewJobDetails('${job.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn edit-btn" onclick="editJob('${job.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteJob('${job.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            jobContainer.appendChild(jobCard);
            
            anime({
                targets: jobCard,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    }
    
    function renderTimeline() {
        const recentJobs = [...jobs]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        timeline.innerHTML = "";
        
        if (recentJobs.length === 0) {
            timeline.innerHTML = `<div class="no-timeline">No recent applications to show</div>`;
            return;
        }
        
        recentJobs.forEach(job => {
            const timelineItem = document.createElement("div");
            timelineItem.className = `timeline-item ${job.status.toLowerCase()}`;
            timelineItem.innerHTML = `
                <div class="timeline-date">${formatDate(job.date)}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${job.title}</div>
                    <div class="timeline-company">${job.company}</div>
                    <div class="timeline-status">Status: ${job.status}</div>
                </div>
            `;
            timeline.appendChild(timelineItem);
        });
    }
    
    function formatDate(dateString) {
        if (!dateString) return "Not specified";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function updateStats() {
        totalAppsEl.textContent = jobs.length;
        activeAppsEl.textContent = jobs.filter(j => !["Rejected", "Offer"].includes(j.status)).length;
        interviewAppsEl.textContent = jobs.filter(j => j.status === "Interview").length;
        offerAppsEl.textContent = jobs.filter(j => j.status === "Offer").length;
        
        document.querySelectorAll('.stat-progress').forEach((el, index) => {
            const values = [
                jobs.length,
                jobs.filter(j => !["Rejected", "Offer"].includes(j.status)).length,
                jobs.filter(j => j.status === "Interview").length,
                jobs.filter(j => j.status === "Offer").length
            ];
            const maxValue = Math.max(...values.filter(v => !isNaN(v)), 1);
            const percentage = (values[index] / maxValue) * 100;
            el.style.setProperty('--progress-width', `${percentage}%`);
        });
        
        updateChart();
    }
    
    function animateStats() {
        anime({
            targets: '.stat',
            scale: [1, 1.05, 1],
            duration: 600,
            easing: 'easeInOutQuad'
        });
        
        anime({
            targets: '.stat-progress',
            width: (el) => el.style.getPropertyValue('--progress-width'),
            duration: 800,
            easing: 'easeOutQuad'
        });
    }
    
    function initChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: getChartData(),
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
    
    function updateChart() {
        if (statusChart) {
            statusChart.data = getChartData();
            statusChart.options.plugins.legend.labels.color = 
                document.body.classList.contains('light-mode') 
                ? 'rgba(0, 0, 0, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)';
            statusChart.update();
        }
    }
    
    function getChartData() {
        const statusCounts = {
            Saved: 0,
            Applied: 0,
            Interview: 0,
            Offer: 0,
            Rejected: 0
        };
        
        jobs.forEach(job => {
            statusCounts[job.status]++;
        });
        
        return {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
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
    
    async function searchJobs() {
        const query = jobSearch.value.trim();
        const location = document.getElementById("searchLocation").value;
        const type = document.getElementById("searchType").value;
        
        searchResults.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Searching for jobs...</p>
            </div>
        `;
        
        try {
            const results = await fetchJobVacancies(query, location, type);
            displaySearchResults(results);
        } catch (error) {
            showNotification("Failed to fetch job listings. Please try again.", "error");
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Error fetching jobs</h4>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
    
    async function fetchDefaultJobs() {
        searchResults.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Loading featured jobs...</p>
            </div>
        `;
        
        try {
            const results = await fetchJobVacancies("", "", ""); // Empty query for default listings
            displaySearchResults(results);
        } catch (error) {
            showNotification("Failed to load featured jobs.", "error");
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Error loading jobs</h4>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
    
    async function fetchJobVacancies(query, location, type) {
        // Mock API response with diverse job listings
        const jobListings = [
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
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filter jobs based on query, location, and type
        return jobListings.filter(job => {
            const matchesQuery = !query || 
                job.title.toLowerCase().includes(query.toLowerCase()) || 
                job.company.toLowerCase().includes(query.toLowerCase()) ||
                job.description.toLowerCase().includes(query.toLowerCase());
            const matchesLocation = !location || 
                job.location.toLowerCase().includes(location.toLowerCase());
            const matchesType = !type || 
                job.type.toLowerCase().includes(type.toLowerCase());
            return matchesQuery && matchesLocation && matchesType;
        });
        
        // For a real API implementation, you would use:
        /*
        const response = await fetch(`https://api.example.com/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`, {
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY'
            }
        });
        return response.json();
        */
    }
    
    function displaySearchResults(results) {
        searchResults.innerHTML = "";
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>No jobs found</h4>
                    <p>Try different keywords or clear filters</p>
                    <button class="gradient-btn primary-btn" onclick="fetchDefaultJobs()">
                        <i class="fas fa-sync"></i> Show Featured Jobs
                    </button>
                </div>
            `;
            return;
        }
        
        searchResults.innerHTML = `
            <div class="search-header">
                <h3>Available Jobs (${results.length})</h3>
                <button class="gradient-btn secondary-btn" onclick="fetchDefaultJobs()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            ${results.map(job => `
                <div class="search-result">
                    <h4>${job.title}</h4>
                    <div class="result-meta">
                        <span class="company">${job.company}</span>
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span class="type"><i class="fas fa-clock"></i> ${job.type}</span>
                        <span class="posted"><i class="fas fa-calendar"></i> Posted ${formatDate(job.posted)}</span>
                        ${job.salary ? `<span class="salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>` : ''}
                    </div>
                    <p class="description">${job.description}</p>
                    <div class="result-actions">
                        <button class="gradient-btn primary-btn small-btn" onclick="addJobFromSearch('${job.title.replace(/'/g, "\\'")}', '${job.company.replace(/'/g, "\\'")}', '${job.location.replace(/'/g, "\\'")}', '${job.url.replace(/'/g, "\\'")}', '${job.salary ? job.salary.replace(/'/g, "\\'") : ''}')">
                            <i class="fas fa-plus"></i> Track Application
                        </button>
                        <a href="${job.url}" target="_blank" class="secondary-btn small-btn">
                            <i class="fas fa-external-link-alt"></i> View Job
                        </a>
                    </div>
                </div>
            `).join("")}
        `;
        
        anime({
            targets: '.search-result',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });
    }
    
    function showNotification(message, type) {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add("show");
            setTimeout(() => {
                notification.classList.remove("show");
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }, 10);
    }
    
    function toggleTheme() {
        document.body.classList.toggle("light-mode");
        const isLightMode = document.body.classList.contains("light-mode");
        localStorage.setItem("theme", isLightMode ? "light" : "dark");
        themeToggle.innerHTML = isLightMode ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
        
        updateChart();
    }
    
    function checkThemePreference() {
        const savedTheme = localStorage.getItem("theme") || 
                          (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark");
        
        if (savedTheme === "light") {
            document.body.classList.add("light-mode");
            themeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
        } else {
            themeToggle.innerHTML = `<i class="fas fa-moon"></i>`;
        }
    }
    
    window.viewJobDetails = function(jobId) {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;
        
        const detailsContent = document.getElementById("jobDetailsContent");
        detailsContent.innerHTML = `
            <h2>${job.title}</h2>
            <div class="detail-row">
                <div class="detail-label">Company</div>
                <div class="detail-value">${job.company}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Application Date</div>
                <div class="detail-value">${formatDate(job.date)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="job-status job-${job.status.toLowerCase()}">${job.status}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Priority</div>
                <div class="detail-value"><span class="job-priority priority-${job.priority.toLowerCase()}">${job.priority}</span></div>
            </div>
            ${job.location ? `
            <div class="detail-row">
                <div class="detail-label">Location</div>
                <div class="detail-value"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>
            </div>
            ` : ''}
            ${job.salary ? `
            <div class="detail-row">
                <div class="detail-label">Salary Range</div>
                <div class="detail-value"><i class="fas fa-dollar-sign"></i> ${job.salary}</div>
            </div>
            ` : ''}
            ${job.url ? `
            <div class="detail-row">
                <div class="detail-label">Job Posting</div>
                <div class="detail-value"><a href="${job.url}" target="_blank"><i class="fas fa-external-link-alt"></i> View Original Posting</a></div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${job.notes || "No notes added"}</div>
            </div>
            
            ${job.interview.date || job.interview.type ? `
            <div class="detail-section">
                <h3><i class="fas fa-calendar-alt"></i> Interview Details</h3>
                ${job.interview.date ? `
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formatDateTime(job.interview.date)}</div>
                </div>
                ` : ''}
                ${job.interview.type ? `
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${job.interview.type}</div>
                </div>
                ` : ''}
                ${job.interview.prep ? `
                <div class="detail-row">
                    <div class="detail-label">Preparation Notes</div>
                    <div class="detail-value">${job.interview.prep}</div>
                </div>
                ` : ''}
                ${job.interview.feedback ? `
                <div class="detail-row">
                    <div class="detail-label">Feedback</div>
                    <div class="detail-value">${job.interview.feedback}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="detail-actions">
                <button class="gradient-btn primary-btn" onclick="editJob('${job.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="secondary-btn" onclick="deleteJob('${job.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        detailsModal.style.display = "block";
        
        anime({
            targets: detailsModal,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    };
    
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return "";
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeString).toLocaleDateString(undefined, options);
    }
    
    window.editJob = function(jobId) {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;
        
        document.getElementById("jobTitle").value = job.title;
        document.getElementById("company").value = job.company;
        document.getElementById("applicationDate").value = job.date;
        document.getElementById("status").value = job.status;
        document.getElementById("priority").value = job.priority;
        document.getElementById("jobUrl").value = job.url || "";
        document.getElementById("location").value = job.location || "";
        document.getElementById("salary").value = job.salary || "";
        document.getElementById("notes").value = job.notes || "";
        document.getElementById("interviewDate").value = job.interview.date || "";
        document.getElementById("interviewType").value = job.interview.type || "";
        document.getElementById("interviewPrep").value = job.interview.prep || "";
        document.getElementById("interviewFeedback").value = job.interview.feedback || "";
        
        jobs = jobs.filter(j => j.id !== jobId);
        
        jobModal.style.display = "block";
        detailsModal.style.display = "none";
    };
    
    window.deleteJob = function(jobId) {
        if (confirm("Are you sure you want to delete this application?")) {
            jobs = jobs.filter(job => j.id !== jobId);
            saveJobs();
            renderJobs();
            renderTimeline();
            updateStats();
            closeModals();
            showNotification("Application deleted", "error");
        }
    };
    
    window.addJobFromSearch = function(title, company, location = "", url = "", salary = "") {
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
        jobModal.style.display = "block";
        jobSearch.value = "";
    };
});

// Enhanced styles
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.95);
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
    background: rgba(244, 67, 54, 0.95);
}

.notification.show {
    opacity: 1;
    bottom: 30px;
}

.search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px;
    background: var(--card-bg);
    border-radius: 8px;
}

.search-result {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-result:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

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

.search-loading {
    text-align: center;
    padding: 30px;
    color: var(--dark-text-secondary);
    background: var(--card-bg);
    border-radius: 8px;
}

.no-results {
    text-align: center;
    padding: 30px;
    background: var(--card-bg);
    border-radius: 8px;
}

.no-results button {
    margin-top: 10px;
}

body.light-mode .loading-spinner {
    border-top-color: var(--light-primary);
}

body.light-mode .search-loading,
body.light-mode .no-results {
    color: var(--light-text-secondary);
}

.job-card {
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
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.delete-btn {
    background: #ff4444;
    color: white;
    transition: background 0.2s ease;
}

.delete-btn:hover {
    background: #cc0000;
}

.job-meta {
    display: flex;
    gap: 15px;
    margin: 10px 0;
}

.job-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.action-btn {
    padding: 8px 15px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
}
`;
document.head.appendChild(style);
