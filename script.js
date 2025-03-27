
document.addEventListener("DOMContentLoaded", function() {
    const jobTitle = document.getElementById("jobTitle");
    const company = document.getElementById("company");
    const applicationDate = document.getElementById("applicationDate");
    const status = document.getElementById("status");
    const addJobButton = document.getElementById("addJob");
    const jobContainer = document.getElementById("jobContainer");
    const search = document.getElementById("search");
    const sort = document.getElementById("sort");

    let jobs = JSON.parse(localStorage.getItem("jobs")) || [];

    function saveJobs() {
        localStorage.setItem("jobs", JSON.stringify(jobs));
    }

    function suggestFollowUp(date) {
        if (!date) return "";
        const appDate = new Date(date);
        appDate.setDate(appDate.getDate() + 7); // Suggest follow-up in 7 days
        return `Suggested follow-up: ${appDate.toLocaleDateString()}`;
    }

    function renderJobs(filter = "", sortBy = "date") {
        jobContainer.innerHTML = "";
        let filteredJobs = jobs.filter(job =>
            job.title.toLowerCase().includes(filter.toLowerCase()) ||
            job.company.toLowerCase().includes(filter.toLowerCase())
        );

        filteredJobs.sort((a, b) => {
            if (sortBy === "title") return a.title.localeCompare(b.title);
            if (sortBy === "status") return a.status.localeCompare(b.status);
            return new Date(b.date) - new Date(a.date); // Default: date descending
        });

        filteredJobs.forEach((job, index) => {
            const jobItem = document.createElement("li");
            jobItem.classList.add("job-item");
            jobItem.innerHTML = `
                <div>
                    <strong>${job.title}</strong> at ${job.company} <br>
                    <small>${job.date ? "📅 " + job.date : "No date"}</small> 
                    <span class="status ${job.status}">${job.status}</span>
                    <div class="suggestion">${suggestFollowUp(job.date)}</div>
                </div>
                <button class="delete-btn" onclick="deleteJob(${index})">❌</button>
            `;
            jobContainer.appendChild(jobItem);
        });
    }

    function deleteJob(index) {
        jobs.splice(index, 1);
        saveJobs();
        renderJobs(search.value, sort.value);
    }

    window.deleteJob = deleteJob;

    addJobButton.addEventListener("click", function() {
        if (!jobTitle.value.trim() || !company.value.trim()) {
            alert("Please enter both Job Title and Company.");
            return;
        }

        const newJob = {
            title: jobTitle.value,
            company: company.value,
            date: applicationDate.value,
            status: status.value
        };

        jobs.push(newJob);
        saveJobs();
        renderJobs(search.value, sort.value);

        jobTitle.value = "";
        company.value = "";
        applicationDate.value = "";
        status.value = "Applied";
    });

    search.addEventListener("input", () => renderJobs(search.value, sort.value));
    sort.addEventListener("change", () => renderJobs(search.value, sort.value));

    renderJobs();
});
