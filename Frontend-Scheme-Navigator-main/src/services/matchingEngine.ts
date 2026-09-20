import { Scheme, UserProfile, SchemeMatchResult, MatchFactor } from '../types';

export function isMatchingState(userState?: string, coveredStates?: string[]): boolean {
  if (!userState) return false;
  if (!Array.isArray(coveredStates) || coveredStates.length === 0) return true;
  if (coveredStates.includes('All India')) return true;

  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/nct of/g, '')
      .replace(/state of/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const uNorm = normalize(userState);
  if (!uNorm) return false;

  return coveredStates.some((cs) => {
    if (cs === 'All India') return true;
    const cNorm = normalize(String(cs));
    if (!cNorm) return false;
    return uNorm === cNorm || uNorm.includes(cNorm) || cNorm.includes(uNorm);
  });
}

export function calculateSchemeMatch(scheme: Scheme, profile: UserProfile): SchemeMatchResult {
  const factors: MatchFactor[] = [];
  const matchedReasons: string[] = [];
  const unmatchedWarnings: string[] = [];

  const eligibility = scheme?.eligibility || {};
  const coveredStates = Array.isArray(scheme?.coveredStates) ? scheme.coveredStates : ['All India'];
  const name = (scheme?.name || '').trim();
  const nameL = name.toLowerCase();
  const tagline = (scheme?.tagline || '').trim().toLowerCase();
  const desc = (scheme?.shortDescription || scheme?.detailedDescription || '').trim().toLowerCase();
  const cat = (scheme?.category || '').trim();
  const customConds = (eligibility.customConditions || []).map((c) => String(c).toLowerCase());
  const condsText = customConds.join(' ');
  const tagsText = (scheme?.tags || []).join(' ').toLowerCase();
  const allText = `${nameL} ${cat.toLowerCase()} ${tagline} ${desc} ${condsText} ${tagsText}`;

  const userAge = typeof profile?.age === 'number' ? profile.age : null;
  const userGender = String(profile?.gender || '').trim().toLowerCase();
  const userState = (profile?.state || '').trim();
  const userOcc = String(profile?.employmentType || profile?.occupation || '').trim().toLowerCase();
  const userCat = (profile?.category || 'General').trim();
  const userIncome = profile?.incomeRange || '';
  const userDisabled = Boolean(profile?.isDisability || profile?.hasDisability);
  const userBpl = Boolean(profile?.hasBPLCard || profile?.isBPL || userIncome === 'Below ₹1 lakh');
  const userMinority = Boolean(profile?.isMinority);

  // Helper to build not eligible response
  const notEligible = (warning: string): SchemeMatchResult => ({
    scheme,
    matchScore: 0,
    matchGrade: 'Not Eligible',
    matchedReasons: [],
    unmatchedWarnings: [warning],
    factors: [
      {
        criterion: 'Eligibility Check',
        status: 'mismatch',
        explanation: warning,
        weight: 100,
        score: 0,
      },
    ],
  });

  // =========================================================================
  // STRICT STATUTORY INELIGIBILITY FILTERS (Score 0 on Violation)
  // =========================================================================

  // 1. State / Geography Verification
  const isAllIndia = coveredStates.includes('All India') || coveredStates.length === 0;
  const isUserState = isMatchingState(userState, coveredStates);
  if (!isAllIndia && !isUserState && userState) {
    return notEligible(`Restricted to residents of ${coveredStates.join(', ')} (your state is ${userState})`);
  }

  // 2. Gender Verification
  const allowedGenders = (eligibility.allowedGenders || []).map((g) => String(g).toLowerCase());
  if (allowedGenders.length > 0 && !allowedGenders.includes('all') && userGender) {
    if (!allowedGenders.includes(userGender)) {
      return notEligible(`Reserved for ${allowedGenders.join(', ')} applicants only`);
    }
  }

  const femaleKw = [
    'mahila', 'kanya', 'sukanya', 'widow', 'maternity', 'pregnant',
    'girl child', 'kishori', 'ladli', 'women only', 'female only', 'matru vandana',
    'laxmi', 'bhagyashree', 'prasooti', 'stree', 'didi', 'beti', 'balika', 'nari'
  ];
  if (userGender === 'male') {
    if (cat === 'Women & Child') {
      return notEligible('Targeted specifically for female beneficiaries');
    }
    if (femaleKw.some((kw) => allText.includes(kw)) || allText.includes('widow')) {
      const broadWords = ['both boys and girls', 'all genders', 'boys and girls', 'children of', 'widower'];
      if (!broadWords.some((w) => allText.includes(w))) {
        return notEligible('Targeted specifically for female beneficiaries');
      }
    }
    if (['applicant should be a female', 'girl child', 'widow', 'pregnant woman', 'lactating mother'].some((kw) => condsText.includes(kw))) {
      return notEligible('Targeted specifically for female beneficiaries');
    }
  }

  if (userGender === 'female') {
    if (['men only', 'male only', 'boys only', 'purush'].some((kw) => allText.includes(kw))) {
      return notEligible('Targeted specifically for male beneficiaries');
    }
  }

  // 3. Benchmark Disability Verification
  const disabilityKw = [
    'students with disabilities', 'persons with disabilities', 'divyangjan',
    'disability pension', 'locomotor disability', 'benchmark disability', 'handicapped'
  ];
  const requiresDisability = Boolean(eligibility.requiresDisability) || (
    disabilityKw.some((kw) => allText.includes(kw)) && !allText.includes('without disability')
  );
  if (requiresDisability && !userDisabled) {
    return notEligible('Requires benchmark disability certificate (40%+ Divyangjan)');
  }

  // 4. Social Category / Caste Reservation Verification
  const allowedCats = eligibility.allowedCategories || [];
  if (allowedCats.length > 0 && !allowedCats.includes('All' as any) && userCat) {
    const isCatMatched = allowedCats.includes(userCat as any) ||
      (userCat === 'SC' && allowedCats.includes('ST' as any)) ||
      (userCat === 'ST' && allowedCats.includes('SC' as any));
    if (!isCatMatched) {
      return notEligible(`Reserved exclusively for ${allowedCats.join(', ')} categories`);
    }
  }

  const minorityRegex = /\b(for\s+minority|for\s+minorities|minority\s+students|minority\s+community|minority\s+scheme)\b/i;
  const requiresMinority = Boolean(eligibility.requiresMinority) || (
    minorityRegex.test(allText) && !allText.includes('non-minority') && !allText.includes('all communities')
  );
  if (requiresMinority && !userMinority) {
    return notEligible('Reserved for students from notified minority communities');
  }

  if (userCat === 'General') {
    const affirmativeRegex = /\b(for\s+sc\b|for\s+st\b|for\s+obc\b|for\s+ebc\b|for\s+dnt\b|scheduled\s+caste|scheduled\s+tribe|backward\s+classes|obc\s+students|sc\s+students|st\s+students|obc\s+candidates|minority\s+community|for\s+minority|for\s+minorities)\b/i;
    if (affirmativeRegex.test(allText)) {
      if (!['general', 'all categories', 'open to all'].some((w) => allText.includes(w))) {
        return notEligible('Reserved for affirmative action categories (SC/ST/OBC/Minority)');
      }
    }
    if (customConds.some((c) => affirmativeRegex.test(c))) {
      if (!['general', 'all categories', 'open to all'].some((w) => condsText.includes(w))) {
        return notEligible('Reserved for affirmative action categories (SC/ST/OBC/Minority)');
      }
    }
  }

  // 5. Age Limits & Statutory Age Verification
  const minAge = eligibility.minAge ?? 0;
  const maxAge = eligibility.maxAge ?? 100;
  if (userAge !== null) {
    if (minAge > 0 && userAge < minAge - 1) {
      return notEligible(`Minimum eligible age is ${minAge} years (your age: ${userAge})`);
    }
    if (maxAge < 100 && userAge > maxAge + 1) {
      return notEligible(`Maximum eligible age is ${maxAge} years (your age: ${userAge})`);
    }

    // Senior citizen pensions (60+)
    const seniorKw = [
      'senior citizen pension', 'old age pension', 'vridha pension', 'vridhavastha',
      'vaya vandana', '70+ years', 'age of 60 years or above', 'aged 60 years and above'
    ];
    if (seniorKw.some((term) => allText.includes(term)) && userAge < 60) {
      return notEligible(`Reserved for Senior Citizens aged 60+ (your age: ${userAge})`);
    }

    // Minor school child schemes
    const schoolRegex = /\b(class\s*(?:1|1st|i)\s*to\s*(?:8|8th|10|10th|12|12th)|classes\s*1\s*to\s*12|pre-matric|school\s*children|primary\s*school|girl\s*child\s*under\s*10|school\s*uniforms)\b/i;
    if (schoolRegex.test(allText) && userAge >= 18) {
      return notEligible('Restricted to school-going children (Class 1st to 12th)');
    }
  }

  // 6. DOMAIN & OCCUPATIONAL STATUTORY EXCLUSIONS
  // A) Education & Student Schemes
  const eduKw = [
    'scholarship', 'fellowship', 'school student', 'college student', 'aicte',
    'post-matric', 'pre-matric', 'tuition fee', 'b.tech', 'ug/pg', 'higher education',
    'study tour', 'degree college'
  ];
  const isEducationScheme = cat === 'Education' || eduKw.some((w) => allText.includes(w));
  if (isEducationScheme) {
    if (userOcc !== 'student' && userAge !== null && userAge >= 26) {
      return notEligible('Restricted to actively enrolled students');
    }
    if (['farmer', 'retired', 'business owner', 'employed', 'self-employed', 'homemaker'].includes(userOcc)) {
      return notEligible('Reserved for enrolled students');
    }
  }

  // B) Agriculture & Farmer Subsidies
  const agriKw = [
    'kisan', 'fasal bima', 'pm-kusum', 'crop insurance', 'krishi',
    'tractor subsidy', 'fertilizer subsidy', 'fish hatcheries', 'aquaculture',
    'seed subsidy', 'irrigation subsidy', 'soil health', 'horticulture mission'
  ];
  const isAgri = cat === 'Agriculture' || agriKw.some((w) => allText.includes(w));
  if (isAgri && !['farmer', 'other', ''].includes(userOcc)) {
    if (['student', 'homemaker', 'employed', 'retired', 'business owner'].includes(userOcc)) {
      return notEligible('Targeted exclusively for agricultural farmers & landholders');
    }
  }

  // C) Senior Citizen vs Youth Schemes
  if (userAge !== null && userAge >= 50) {
    const youthKw = [
      'youth seed', 'yuva udyami', 'yuvak', 'adolescent', 'between 18 and 35 years', '18-35 years', '18 to 35'
    ];
    if (youthKw.some((w) => allText.includes(w))) {
      return notEligible('Restricted to youth beneficiaries');
    }
  }

  // D) Labour / Construction Board (BOCW)
  const labourKw = ['hbocwwb', 'construction worker', 'silicosis board', 'building or construction work', 'bocw', 'shramik card'];
  if (labourKw.some((w) => allText.includes(w))) {
    if (!['unemployed', 'self-employed', 'labour', 'construction worker', 'shramik'].includes(userOcc)) {
      return notEligible('Requires active registration with Construction Labour Board (BOCW)');
    }
  }

  // E) High Income Means Testing
  if (['₹5–10 lakh', '₹10 lakh+', 'Above ₹5 lakh'].includes(userIncome)) {
    const requiresBpl = Boolean(eligibility.requiresBPL) || ['bpl card', 'antyodaya', 'ration card holder', 'below poverty line', 'destitute'].some((w) => condsText.includes(w));
    if (requiresBpl) {
      return notEligible('Income ceiling exceeded (reserved for BPL/Antyodaya households)');
    }
    if (eligibility.maxAnnualIncome && eligibility.maxAnnualIncome <= 300000) {
      return notEligible(`Income exceeds ceiling of ₹${eligibility.maxAnnualIncome.toLocaleString()}`);
    }
  }

  // =========================================================================
  // TRUE ZERO-BASED SCORE TRACKING (Starting at 0, Points Earned on True Fit)
  // =========================================================================
  let score = 0;

  // --- FACTOR 1: Primary Occupation & Sector Fit (0 to 35 pts) ---
  let occScore = 0;
  if (userOcc === 'farmer') {
    if (isAgri) {
      occScore = 35;
      matchedReasons.push('Directly matches your farming & agricultural background');
    } else if (['Financial Assistance', 'Social Security', 'Housing', 'Healthcare'].includes(cat)) {
      occScore = 15;
      matchedReasons.push('General public welfare initiative available to rural households');
    } else {
      occScore = 5;
    }
  } else if (userOcc === 'student') {
    if (isEducationScheme || ['Education', 'Skill Development'].includes(cat)) {
      occScore = 35;
      matchedReasons.push('Directly tailored for student education & skill building');
    } else if (['Financial Assistance', 'Social Security', 'Healthcare'].includes(cat)) {
      occScore = 15;
      matchedReasons.push('General public welfare initiative available to students');
    } else {
      occScore = 5;
    }
  } else if (['business owner', 'self-employed'].includes(userOcc)) {
    const bizMatches = ['msme', 'mudra', 'startup', 'udyam', 'pmegp', 'credit', 'enterprise', 'subsidy'];
    if (['Business', 'Employment'].includes(cat) || bizMatches.some((w) => allText.includes(w))) {
      occScore = 35;
      matchedReasons.push('Supports business enterprises and self-employed professionals');
    } else if (['Financial Assistance', 'Skill Development'].includes(cat)) {
      occScore = 18;
    } else if (['Healthcare', 'Social Security'].includes(cat)) {
      occScore = 14;
    } else {
      occScore = 5;
    }
  } else if (userOcc === 'retired' || (userAge !== null && userAge >= 60)) {
    const pensionKw = ['pension', 'old age', 'senior citizen', 'vridha', 'elderly', 'ignaps'];
    if (pensionKw.some((w) => allText.includes(w))) {
      occScore = 35;
      matchedReasons.push('Dedicated senior citizen / pension support');
    } else if (['Social Security', 'Healthcare', 'Financial Assistance'].includes(cat)) {
      occScore = 25;
    } else {
      occScore = 8;
    }
  } else if (userOcc === 'unemployed') {
    if (['Employment', 'Skill Development'].includes(cat) || ['rozgar', 'mgnrega', 'kaushal', 'pmkvy', 'apprentice', 'skill'].some((w) => allText.includes(w))) {
      occScore = 35;
      matchedReasons.push('Directly provides employment opportunities and skill training');
    } else if (['Social Security', 'Financial Assistance'].includes(cat)) {
      occScore = 18;
    } else {
      occScore = 8;
    }
  } else if (userOcc === 'homemaker') {
    if (['Women & Child', 'Social Security'].includes(cat) || ['ujjwala', 'ration', 'poshan', 'lakhpati', 'shg', 'aajeevika'].some((w) => allText.includes(w))) {
      occScore = 35;
      matchedReasons.push('Dedicated welfare support for families and women');
    } else if (['Financial Assistance', 'Healthcare', 'Housing'].includes(cat)) {
      occScore = 20;
    } else {
      occScore = 8;
    }
  } else {
    occScore = 15;
  }

  score += occScore;
  factors.push({
    criterion: 'Occupation Alignment',
    score: occScore,
    weight: 35,
    status: occScore >= 15 ? 'matched' : 'neutral',
    explanation: `Domain fit based on ${profile?.employmentType || 'occupation'}.`,
  });

  // --- FACTOR 2: Age Bracket & Life Stage Alignment (0 to 25 pts) ---
  let ageScore = 0;
  if (userAge !== null && userAge >= 60) {
    const seniorFit = ['pension', 'old age', 'senior citizen', 'vridha', 'elderly', 'ignaps', 'geriatric', 'vaya vandana'];
    if (seniorFit.some((w) => allText.includes(w))) {
      ageScore = 25;
      matchedReasons.push(`Specifically designed for Senior Citizens aged ${userAge}+`);
    } else if (['Healthcare', 'Social Security'].includes(cat)) {
      ageScore = 15;
    } else {
      ageScore = 8;
    }
  } else if (userAge !== null && userAge >= 18 && userAge <= 25) {
    const youthFit = ['youth', 'yuva', 'student', 'scholarship', 'higher education', 'undergraduate', 'b.tech'];
    if (youthFit.some((w) => allText.includes(w))) {
      ageScore = 25;
      matchedReasons.push(`Prime eligibility for youth / students aged ${userAge}`);
    } else if (['Education', 'Skill Development'].includes(cat)) {
      ageScore = 18;
    } else {
      ageScore = 8;
    }
  } else {
    if (minAge > 0 && maxAge < 100 && userAge !== null && userAge >= minAge && userAge <= maxAge) {
      ageScore = 20;
    } else {
      ageScore = 10;
    }
  }

  score += ageScore;
  factors.push({
    criterion: 'Age & Life Stage',
    score: ageScore,
    weight: 25,
    status: ageScore >= 15 ? 'matched' : 'neutral',
    explanation: `Life stage evaluated for age ${userAge ?? 'specified'}.`,
  });

  // --- FACTOR 3: Geographic & State Implementation (0 to 25 pts) ---
  let locScore = 0;
  if (isUserState && !isAllIndia) {
    locScore = 25;
    matchedReasons.push(`State-specific initiative enacted by Government of ${userState}`);
  } else if (isAllIndia) {
    locScore = 20;
    matchedReasons.push('Central / Nationwide flagship scheme active across All India');
  } else {
    locScore = 5;
  }

  score += locScore;
  factors.push({
    criterion: 'State Location',
    score: locScore,
    weight: 25,
    status: locScore >= 15 ? 'matched' : 'neutral',
    explanation: `Implementation jurisdiction in ${userState || 'India'}.`,
  });

  // --- FACTOR 4: Socio-Economic & Income Fit (0 to 15 pts) ---
  let econScore = 0;
  if (userBpl) {
    const bplMatches = ['bpl', 'antyodaya', 'ration', 'low income', 'poor', 'free'];
    if (bplMatches.some((w) => allText.includes(w))) {
      econScore = 15;
      matchedReasons.push('Income bracket fully satisfies financial assistance norms');
    } else {
      econScore = 10;
    }
  } else if (['Below ₹1 lakh', '₹1–2.5 lakh'].includes(userIncome)) {
    econScore = 12;
    matchedReasons.push('Income within eligible bracket for targeted public support');
  } else {
    econScore = 8;
  }

  score += econScore;
  factors.push({
    criterion: 'Economic Need',
    score: econScore,
    weight: 15,
    status: econScore >= 10 ? 'matched' : 'neutral',
    explanation: `Income evaluated for ${userIncome || 'general'} bracket.`,
  });

  const finalScore = Math.max(0, Math.min(99, score));
  // Ensure factor sum exactly equals finalScore
  const factorSum = factors.reduce((acc, f) => acc + (f.score || 0), 0);
  if (factorSum > 0 && factorSum !== finalScore) {
    const diff = finalScore - factorSum;
    const occFactor = factors.find((f) => f.criterion === 'Occupation Alignment');
    if (occFactor) {
      occFactor.score = Math.max(0, Math.min(occFactor.weight, occFactor.score + diff));
    }
  }
  let matchGrade: SchemeMatchResult['matchGrade'] = 'General Match';
  if (finalScore >= 85) matchGrade = 'High Potential';
  else if (finalScore >= 70) matchGrade = 'Good Match';
  else if (finalScore >= 50) matchGrade = 'Moderate Match';

  return {
    scheme,
    matchScore: finalScore,
    matchGrade,
    matchedReasons: matchedReasons.slice(0, 4),
    unmatchedWarnings: unmatchedWarnings.slice(0, 3),
    factors,
  };
}

export function rankSchemesForProfile(
  profile: UserProfile,
  schemes: Scheme[] = []
): SchemeMatchResult[] {
  const results = schemes
    .map((scheme) => calculateSchemeMatch(scheme, profile))
    .filter((r) => r.matchScore >= 45 && r.matchGrade !== 'Not Eligible');

  // Sort descending by match score, then popularity
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (b.scheme.popularScore || 0) - (a.scheme.popularScore || 0);
  });
}

