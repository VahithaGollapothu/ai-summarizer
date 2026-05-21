export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required"
            });
        }

        return res.status(200).json({
            summary: "Backend API working"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });

    }
}