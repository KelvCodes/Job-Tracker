document.addEventListener("DOMContentLoaded", function() {
    const jobTitle = document.getElementById("jobTitle");
    const company = document.getElementById("company");
    const applicationDate = document.getElementById("applicationDate");
    const status = document.getElementById("status");
    const addJobButton = document.getElementById("addJob");
    const jobContainer = document.getElementById("jobContainer");

    // Load jobs from localStorage
    let jobs = JSON.parse(localStorage.getItem("jobs")) || [];

    function saveJobs() {
        localStorage.setItem("jobs", JSON.stringify(jobs));
    }

    function renderJobs() {
        jobContainer.innerHTML = "";
        jobs.forEach((job, index) => {
            const jobItem = document.createElement("li");
            jobItem.classList.add("job-item");

            jobItem.innerHTML = `
                <div>
                    <strong>${job.title}</strong> at ${job.company} <br>
                    <small>${job.date ? "📅 " + job.date : ""}</small>  
                    <span class="status">(${job.status})</span>
                </div>
                <button class="delete-btn" onclick="deleteJob(${index})">❌</button>
            `;
            jobContainer.appendChild(jobItem);
        });
    }

    function deleteJob(index) {
        jobs.splice(index, 1);
        saveJobs();
        renderJobs();
    }

    window.deleteJob = deleteJob;

    addJobButton.addEventListener("click", function() {
        if (jobTitle.value.trim() === "" || company.value.trim() === "") {
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
        renderJobs();

        // Clear input fields
        jobTitle.value = "";
        company.value = "";
        applicationDate.value = "";
        status.value = "Applied";
    });

    // Render jobs on page load
    renderJobs();
});
