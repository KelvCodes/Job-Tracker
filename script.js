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
