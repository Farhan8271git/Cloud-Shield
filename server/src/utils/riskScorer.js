const calculateRiskScore = ({ uniqueFilesModified ,totalEvents, windowSeconds,}) => {
    let score = 0;
    const reasons = [];

    // Score based on number of unique files modified
    if (uniqueFilesModified > 10) {
        score += 45;

        reasons.push(
            "More than 10 unique files were modified."
        );
    } else if (uniqueFilesModified >= 6) {
        score += 30;

        reasons.push(
            "6 to 10 unique files were modified."
        );
    } else if (uniqueFilesModified >= 3) {
        score += 15;

        reasons.push(
            "3 to 5 unique files were modified."
        );
    } else if (uniqueFilesModified >= 1) {
        score += 5;

        reasons.push(
            "File modification activity was detected."
        );
    }

    // Score based on modification frequency
    if (totalEvents > 10 && windowSeconds <= 30) {
        score += 25;

        reasons.push(
            "More than 10 integrity events occurred within 30 seconds."
        );
    } else if (totalEvents > 3 && windowSeconds <= 30) {
        score += 15;

        reasons.push(
            "More than 3 integrity events occurred within 30 seconds."
        );
    }

    return {
        score: Math.min(score, 100),
        reasons,
    };
};

const getRiskLevel = (score) => {
    if (score >= 80) {
        return "critical";
    }

    if (score >= 60) {
        return "high";
    }

    if (score >= 30) {
        return "medium";
    }

    return "low";
};

export default {
    calculateRiskScore,
    getRiskLevel,
};