document.addEventListener('DOMContentLoaded', () => {
    const portfolioContainer = document.getElementById('portfolio-container');

    if (portfolioContainer) {
        fetchPortfolio();
    }

    async function fetchPortfolio() {
        try {
            const res = await fetch('/api/portfolio');
            const items = await res.json();
            
            if (items.length === 0) {
                portfolioContainer.innerHTML = '<p>No completed gigs yet.</p>';
                return;
            }

            portfolioContainer.innerHTML = items.map(item => `
                <div class="card">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="meta">
                        <span>Completed on: ${item.completed_date}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
        }
    }
});
