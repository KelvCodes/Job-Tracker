deck", function() {
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
