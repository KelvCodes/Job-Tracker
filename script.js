
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
        
        // Show success animation
        const success = document.createElement("div");
        success.className = "success-animation";
        success.innerHTML = `<i class="fas fa-check-circle"></i> Application added successfully!`;
        document.body.appendChild(success);
        
        setTimeout(() => {
            success.classList.add("show");
            setTimeout(() => {
                success.classList.remove("show");
                setTimeout(() => {
                    document.body.removeChild(success);
                }, 300);
            }, 2000);
        }, 10);
    }
    
    function saveJobs() {
        localStorage.setItem("jobs", JSON.stringify(jobs));
    }
    
    function renderJobs() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilterValue = statusFilter.value;
        const sortValue = sortSelect.value;
        
        // Filter jobs
        let filteredJobs = jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm) || 
                                job.company.toLowerCase().includes(searchTerm) ||
                                (job.location && job.location.toLowerCase().includes(searchTerm));
            const matchesStatus = statusFilterValue === "all" || job.status === statusFilterValue;
            return matchesSearch && matchesStatus;
        });
        
        // Sort jobs
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
                default: // date-desc
                    return new Date(b.date) - new Date(a.date);
            }
        });
        
        // Helper function to extract numeric value from salary string
        function extractSalary(job) {
            if (!job.salary) return 0;
            const match = job.salary.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        }
        
        // Render jobs
        jobContainer.innerHTML = "";
        
        if (filteredJobs.length === 0) {
            jobContainer.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-briefcase"></i>
                    <h4>No applications found</h4>
                    <p>Try adjusting your filters or add a new application</p>
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
                </div>
            `;
            jobContainer.appendChild(jobCard);
            
            // Add animation
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
        // Get the 5 most recent jobs
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
        
        // Update progress bars
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
            targets: '.stat-progress::after',
            width: (el) => {
                const currentWidth = parseFloat(el.style.width || '0');
                return `${currentWidth}%`;
            },
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
                                family: "'Segoe UI', 'Roboto', sans-serif"
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }
    
    function updateChart() {
        if (statusChart) {
            statusChart.data = getChartData();
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
                borderWidth: 1,
                hoverOffset: 10
            }]
        };
    }
    
    function searchJobs() {
        const query = jobSearch.value.trim();
        const location = document.getElementById("searchLocation").value;
        const type = document.getElementById("searchType").value;
        
        if (!query) {
            searchResults.innerHTML = `<div class="no-results">Please enter a search term</div>`;
            return;
        }
        
        // Show loading state
        searchResults.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Searching for jobs...</p>
            </div>
        `;
        
        // In a real app, this would be an API call
        // Here we're mocking some search results with a delay
        setTimeout(() => {
            const mockResults = [
                {
                    title: "Senior Frontend Developer",
                    company: "TechCorp",
                    location: "Remote",
                    type: "Full-time",
                    description: "Looking for an experienced frontend developer with React skills to join our growing team.",
                    url: "https://example.com/job/123"
                },
                {
                    title: "Full Stack Engineer",
                    company: "WebSolutions",
                    location: "New York, NY",
                    type: "Full-time",
                    description: "Join our team to build amazing web applications with modern technologies like Node.js and React.",
                    url: "https://example.com/job/456"
                },
                {
                    title: "UI/UX Designer",
                    company: "DesignHub",
                    location: "San Francisco, CA",
                    type: "Contract",
                    description: "Create beautiful user interfaces for our clients. Must have experience with Figma and Adobe Creative Suite.",
                    url: "https://example.com/job/789"
                },
                {
                    title: "Backend Developer",
                    company: "DataSystems",
                    location: "Remote",
                    type: "Full-time",
                    description: "Work on our scalable backend systems using Python and Django. Experience with AWS required.",
                    url: "https://example.com/job/101"
                },
                {
                    title: "Product Manager",
                    company: "InnovateCo",
                    location: "Chicago, IL",
                    type: "Full-time",
                    description: "Lead product development from conception to launch. 5+ years of PM experience required.",
                    url: "https://example.com/job/112"
                }
            ];
            
            // Filter mock results based on search query and filters
            const filteredResults = mockResults.filter(job => {
                const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) || 
                                   job.company.toLowerCase().includes(query.toLowerCase());
                const matchesLocation = !location || job.location.toLowerCase().includes(location.toLowerCase());
                const matchesType = !type || job.type.toLowerCase().includes(type.toLowerCase());
                return matchesQuery && matchesLocation && matchesType;
            });
            
            // Display results
            displaySearchResults(filteredResults);
        }, 1000);
    }
    
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>No jobs found</h4>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        searchResults.innerHTML = results.map(job => `
            <div class="search-result">
                <h4>${job.title}</h4>
                <div class="result-meta">
                    <span class="company">${job.company}</span>
                    <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span class="type"><i class="fas fa-clock"></i> ${job.type}</span>
                </div>
                <p class="description">${job.description}</p>
                <div class="result-actions">
                    <button class="gradient-btn primary-btn small-btn" onclick="addJobFromSearch('${job.title.replace(/'/g, "\\'")}', '${job.company.replace(/'/g, "\\'")}', '${job.location.replace(/'/g, "\\'")}')">
                        <i class="fas fa-plus"></i> Track Application
                    </button>
                    <a href="${job.url}" target="_blank" class="secondary-btn small-btn">
                        <i class="fas fa-external-link-alt"></i> View Job
                    </a>
                </div>
            </div>
        `).join("");
        
        // Add animations
        anime({
            targets: '.search-result',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });
    }
    
    function toggleTheme() {
        document.body.classList.toggle("light-mode");
        const isLightMode = document.body.classList.contains("light-mode");
        localStorage.setItem("theme", isLightMode ? "light" : "dark");
        themeToggle.innerHTML = isLightMode ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
        
        // Update chart colors
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
    
    // Functions to be called from HTML
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
        
        // Fill the form with job data
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
        
        // Remove the job from the array (we'll add the edited version back)
        jobs = jobs.filter(j => j.id !== jobId);
        
        jobModal.style.display = "block";
        detailsModal.style.display = "none";
    };
    
    window.deleteJob = function(jobId) {
        if (confirm("Are you sure you want to delete this application?")) {
            jobs = jobs.filter(job => job.id !== jobId);
            saveJobs();
            renderJobs();
            renderTimeline();
            updateStats();
            closeModals();
            
            // Show delete animation
            const deleted = document.createElement("div");
            deleted.className = "success-animation deleted";
            deleted.innerHTML = `<i class="fas fa-trash"></i> Application deleted`;
            document.body.appendChild(deleted);
            
            setTimeout(() => {
                deleted.classList.add("show");
                setTimeout(() => {
                    deleted.classList.remove("show");
                    setTimeout(() => {
                        document.body.removeChild(deleted);
                    }, 300);
                }, 2000);
            }, 10);
        }
    };
    
    window.addJobFromSearch = function(title, company, location = "") {
        document.getElementById("jobTitle").value = title;
        document.getElementById("company").value = company;
        if (location) {
            document.getElementById("location").value = location;
        }
        jobModal.style.display = "block";
        searchResults.innerHTML = "";
        jobSearch.value = "";
    };
});

// Success animation styles (added via JavaScript to keep CSS clean)
const style = document.createElement('style');
style.textContent = `
.success-animation {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
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

.success-animation.deleted {
    background: rgba(244, 67, 54, 0.9);
}

.success-animation.show {
    opacity: 1;
    bottom: 30px;
}

.loading-spinner {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 3px solid var(--dark-primary);
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.search-loading {
    text-align: center;
    padding: 20px;
    color: var(--dark-text-secondary);
}

body.light-mode .loading-spinner {
    border-top-color: var(--light-primary);
}

body.light-mode .search-loading {
    color: var(--light-text-secondary);
}
`;
document.head.appendChild(style);
