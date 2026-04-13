const mreData = [
  // --- ARTICLE IV: RELEVANCE & CHARACTER ---
  {
    id: "401_Relevance",
    category: "Article IV - Relevance",
    difficulty: "Regionals",
    prompt: "Evidence that makes a fact more or less probable.",
    correctAnswer: "Rule 401",
    wrongAnswers: ["Rule 403", "Rule 404", "Rule 602"],
    explanation: "Rule 401 is an incredibly low bar. If the evidence makes a fact even a tiny bit more likely, it's relevant. When defending against a relevance objection, just connect the dot to your burden of proof."
  },
  {
    id: "403_Prejudice",
    category: "Article IV - Relevance",
    difficulty: "ORCS",
    prompt: "Prejudice substantially outweighs probative value.",
    correctAnswer: "Rule 403",
    wrongAnswers: ["Rule 401", "Rule 404", "Rule 801"],
    explanation: "Rule 403 is a balancing test, but the scales are tipped in favor of admission. The prejudice must SUBSTANTIALLY outweigh the probative value. Use this when opposing counsel is introducing highly inflammatory details that barely help their case."
  },
  {
    id: "404_Character",
    category: "Article IV - Character",
    difficulty: "ORCS",
    prompt: "Character evidence used to prove propensity.",
    correctAnswer: "Rule 404(a)(1)",
    wrongAnswers: ["Rule 406", "Rule 608", "Rule 405"],
    explanation: "The ultimate 'propensity' rule. You cannot argue 'they were reckless in the past, so they were reckless today.' Remember: character evidence IS allowed if character is an essential element of a charge or defense (Rule 405b)."
  },
  {
    id: "406_Habit",
    category: "Article IV - Character",
    difficulty: "Nationals",
    prompt: "Semi-automatic, repeated response to a specific situation.",
    correctAnswer: "Rule 406",
    wrongAnswers: ["Rule 404(a)", "Rule 404(b)", "Rule 803(6)"],
    explanation: "This is the primary exception to the character ban. Habit is specific and semi-automatic (e.g., 'he always locks the door when he leaves'). Character is general (e.g., 'he is a cautious person')."
  },
  {
    id: "404b_Crimes",
    category: "Article IV - Character",
    difficulty: "Nationals",
    prompt: "Prior bad acts to prove motive, intent, or plan.",
    correctAnswer: "Rule 404(b)",
    wrongAnswers: ["Rule 406", "Rule 609", "Rule 403"],
    explanation: "The 'MIAMI COP' exception (Motive, Intent, Absence of Mistake, Identity, Common Plan). If you offer prior bad acts, you MUST clearly state the specific non-character purpose you are offering it for."
  },

  // --- ARTICLE VIII: HEARSAY ---
  {
    id: "801c_HearsayDef",
    category: "Article VIII - Hearsay",
    difficulty: "Regionals",
    prompt: "Out-of-court statement offered for the truth.",
    correctAnswer: "Rule 801(c)",
    wrongAnswers: ["Rule 801(d)", "Rule 803", "Rule 602"],
    explanation: "The golden rule of hearsay. If opposing counsel objects, ask yourself: Was it said outside this courtroom? And do I care if the statement is factually true? If you only care THAT it was said (e.g., to show effect on the listener), it's not hearsay."
  },
  {
    id: "801d2_OpposingParty",
    category: "Article VIII - Hearsay",
    difficulty: "Regionals",
    prompt: "Statement made by an opposing party.",
    correctAnswer: "Rule 801(d)(2)",
    wrongAnswers: ["Rule 804(b)(3)", "Rule 803(1)", "Rule 801(d)(1)"],
    explanation: "This is categorically NOT hearsay. If the Plaintiff is suing the Defendant, the Plaintiff can admit anything the Defendant previously said. Warning: You cannot use this to admit your OWN client's out-of-court statements."
  },
  {
    id: "803_1_PresentSense",
    category: "Article VIII - Hearsay",
    difficulty: "ORCS",
    prompt: "Statement describing event made immediately after.",
    correctAnswer: "Rule 803(1)",
    wrongAnswers: ["Rule 803(2)", "Rule 803(3)", "Rule 801(d)(2)"],
    explanation: "The clock is everything here. The statement must happen 'while or immediately after.' If the witness walked home, made a cup of coffee, and then sent a text describing the event, the timeframe for a Present Sense Impression has closed."
  },
  {
    id: "803_2_ExcitedUtterance",
    category: "Article VIII - Hearsay",
    difficulty: "ORCS",
    prompt: "Statement made under stress of startling event.",
    correctAnswer: "Rule 803(2)",
    wrongAnswers: ["Rule 803(1)", "Rule 803(3)", "Rule 804(b)(2)"],
    explanation: "Unlike Present Sense, this exception can last longer than a few minutes, as long as the 'stress of excitement' continues. Look for exclamation points in the witness statement or testimony that the declarant was crying, shaking, or yelling."
  },
  {
    id: "803_3_StateOfMind",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Statement of then-existing state of mind or emotion.",
    correctAnswer: "Rule 803(3)",
    wrongAnswers: ["Rule 803(1)", "Rule 803(4)", "Rule 404(b)"],
    explanation: "Crucial caveat: this exception does NOT include a statement of memory or belief to prove the fact remembered. You can say 'I am scared of him' (emotion). You cannot say 'I am scared because he hit me yesterday' (memory of a past fact)."
  },
  {
    id: "801d1_PriorStatement",
    category: "Article VIII - Hearsay",
    difficulty: "ORCS",
    prompt: "Inconsistent prior sworn statement by testifying witness.",
    correctAnswer: "Rule 801(d)(1)",
    wrongAnswers: ["Rule 801(d)(2)", "Rule 804(b)(1)", "Rule 613"],
    explanation: "This is your impeachment shield. It is categorically NOT hearsay if the witness is currently sitting on the stand and their past sworn statement contradicts what they are saying right now. You are offering it to prove they are lying today."
  },
  {
    id: "803_4_Medical",
    category: "Article VIII - Hearsay",
    difficulty: "ORCS",
    prompt: "Statement pertinent to medical diagnosis or treatment.",
    correctAnswer: "Rule 803(4)",
    wrongAnswers: ["Rule 803(3)", "Rule 803(1)", "Rule 804(b)(2)"],
    explanation: "The magic words are 'reasonably pertinent'. A patient telling a doctor 'my leg hurts' is admissible. Telling the doctor 'my leg hurts because the defendant purposefully ran the red light' is NOT admissible, because who caused the accident isn't necessary for the doctor to fix the leg."
  },
  {
    id: "803_6_BusinessRecords",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Record kept in regular course of business.",
    correctAnswer: "Rule 803(6)",
    wrongAnswers: ["Rule 803(8)", "Rule 902", "Rule 801(d)(2)"],
    explanation: "The ultimate paper-trail exception. You need a 'custodian of records' to lay this foundation. You must prove the record was made at or near the time by someone with knowledge, and that keeping this type of record is a regular practice of that specific business."
  },
  {
    id: "804_a_Unavailable",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Declarant is dead, privileged, or otherwise unavailable.",
    correctAnswer: "Rule 804(a)",
    wrongAnswers: ["Rule 804(b)(2)", "Rule 804(b)(3)", "Rule 104"],
    explanation: "This is the prerequisite lock on the Rule 804 door. You absolutely cannot use a dying declaration or a statement against interest unless you first prove to the judge that the witness is legally 'unavailable' to testify today."
  },
  {
    id: "804_b_2_DyingDec",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Statement made under belief of imminent death.",
    correctAnswer: "Rule 804(b)(2)",
    wrongAnswers: ["Rule 803(2)", "Rule 804(b)(3)", "Rule 803(1)"],
    explanation: "Hollywood's favorite exception. Two massive hurdles: The declarant MUST objectively believe they are about to die right then, and the statement MUST be strictly about why or how they are dying."
  },
  {
    id: "804_b_3_AgainstInterest",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Statement contrary to declarant's financial/penal interest.",
    correctAnswer: "Rule 804(b)(3)",
    wrongAnswers: ["Rule 801(d)(2)", "Rule 804(b)(1)", "Rule 613"],
    explanation: "People don't usually confess to crimes or admit they owe money unless it's true. The declarant must be unavailable, and the statement must be so damaging to them that nobody would invent it. Do not confuse this with an Opposing Party statement."
  },
  {
    id: "805_HearsayWithinHearsay",
    category: "Article VIII - Hearsay",
    difficulty: "Nationals",
    prompt: "Hearsay within hearsay.",
    correctAnswer: "Rule 805",
    wrongAnswers: ["Rule 801(d)", "Rule 104", "Rule 403"],
    explanation: "The double-hearsay Russian nesting doll. If a police report (Layer 1: Business Record) quotes an eyewitness who saw the crash (Layer 2: Present Sense Impression), BOTH layers must have their own valid exception to get the quote admitted."
  },
  // --- ARTICLE VI: WITNESSES ---
  {
    id: "602_PersonalKnowledge",
    category: "Article VI - Witnesses",
    difficulty: "Regionals",
    prompt: "Testifying to a matter without personal knowledge.",
    correctAnswer: "Rule 602",
    wrongAnswers: ["Rule 701", "Rule 401", "Rule 801(c)"],
    explanation: "This is your standard 'Speculation' objection for lay witnesses. A witness can only testify to what they directly saw, heard, or experienced through their own senses. They cannot guess what someone else was thinking."
  },
  {
    id: "608_Truthfulness",
    category: "Article VI - Witnesses",
    difficulty: "ORCS",
    prompt: "Evidence of witness's character for truthfulness or untruthfulness.",
    correctAnswer: "Rule 608",
    wrongAnswers: ["Rule 404(a)", "Rule 609", "Rule 406"],
    explanation: "This is a specific carve-out to the character evidence ban. You CAN attack a witness's reputation for being a liar, but only AFTER their character for truthfulness has been attacked first. You cannot bolster them preemptively."
  },
  {
    id: "609_Convictions",
    category: "Article VI - Witnesses",
    difficulty: "Nationals",
    prompt: "Impeachment by evidence of a criminal conviction.",
    correctAnswer: "Rule 609",
    wrongAnswers: ["Rule 404(b)", "Rule 608", "Rule 403"],
    explanation: "You can bring up a witness's past crimes to prove they are a liar, but the crime MUST be a felony or a crime specifically involving a dishonest act/false statement, and it usually must be less than 10 years old."
  },
  {
    id: "611c_Leading",
    category: "Article VI - Witnesses",
    difficulty: "Regionals",
    prompt: "Question that suggests the answer to the witness.",
    correctAnswer: "Rule 611(c)",
    wrongAnswers: ["Rule 602", "Rule 403", "Rule 104"],
    explanation: "Leading questions are generally forbidden on direct examination, but they are exactly what you MUST use on cross-examination. If a question can be answered with a simple 'Yes' or 'No,' it is likely leading."
  },

  // --- ARTICLE VII: OPINIONS & EXPERTS ---
  {
    id: "701_LayOpinion",
    category: "Article VII - Experts",
    difficulty: "ORCS",
    prompt: "Opinion rationally based on the witness's perception.",
    correctAnswer: "Rule 701",
    wrongAnswers: ["Rule 702", "Rule 602", "Rule 401"],
    explanation: "Lay witnesses CAN give opinions, but only if they are based on common sense observations (e.g., 'he looked drunk,' 'the car was going fast'). They cannot give opinions requiring scientific, technical, or specialized knowledge."
  },
  {
    id: "702_ExpertTestimony",
    category: "Article VII - Experts",
    difficulty: "Regionals",
    prompt: "Opinion based on scientific, technical, or specialized knowledge.",
    correctAnswer: "Rule 702",
    wrongAnswers: ["Rule 701", "Rule 703", "Rule 406"],
    explanation: "The Daubert Standard. Before an expert can give their conclusion, you must lay foundation proving they are qualified, have sufficient facts/data, used reliable methods, and reliably applied those methods to the case."
  },
  {
    id: "703_ExpertBases",
    category: "Article VII - Experts",
    difficulty: "Nationals",
    prompt: "Expert relying on inadmissible facts or data.",
    correctAnswer: "Rule 703",
    wrongAnswers: ["Rule 702", "Rule 704", "Rule 805"],
    explanation: "Experts have a superpower: they can rely on hearsay and other inadmissible evidence to form their opinions, AS LONG AS experts in their particular field would reasonably rely on those same kinds of facts."
  },
  {
    id: "704_UltimateIssue",
    category: "Article VII - Experts",
    difficulty: "ORCS",
    prompt: "Opinion about whether defendant had required mental state.",
    correctAnswer: "Rule 704",
    wrongAnswers: ["Rule 702", "Rule 701", "Rule 404(b)"],
    explanation: "While experts can generally testify to the 'ultimate issue' of the case, they are strictly forbidden from stating an opinion about whether a criminal defendant did or did not have the mental state/condition that constitutes an element of the crime."
  },
  // --- AUTHENTICATION & BEST EVIDENCE ---
  {
    id: "901_Authentication",
    category: "Authentication",
    difficulty: "ORCS",
    prompt: "Evidence must be proved to be what it claims.",
    correctAnswer: "Rule 901",
    wrongAnswers: ["Rule 902", "Rule 1002", "Rule 401"],
    explanation: "Before any physical evidence (like a murder weapon or a printed email) can be admitted, you must lay foundation showing the item is authentic. This is usually done by having a witness with personal knowledge identify it."
  },
  {
    id: "1002_BestEvidence",
    category: "Authentication",
    difficulty: "Nationals",
    prompt: "Original required to prove content of writing or recording.",
    correctAnswer: "Rule 1002",
    wrongAnswers: ["Rule 901", "Rule 803(6)", "Rule 104"],
    explanation: "If a witness is testifying about what a document says, and the actual words in the document are at issue, you must produce the original document. A witness cannot just summarize an unentered document from memory."
  },

  // --- FORM & PROCEDURAL OBJECTIONS ---
  {
    id: "Form_Narrative",
    category: "Form Objections",
    difficulty: "Regionals",
    prompt: "Question invites a long, unstructured story.",
    correctAnswer: "Narrative",
    wrongAnswers: ["Nonresponsive", "Leading", "Argumentative"],
    explanation: "Questions like 'Tell us everything that happened that day' are objectionable because they prevent opposing counsel from anticipating and objecting to inadmissible evidence (like hearsay) before the witness blurts it out."
  },
  {
    id: "Form_Nonresponsive",
    category: "Form Objections",
    difficulty: "Regionals",
    prompt: "Witness answers beyond the scope of the question.",
    correctAnswer: "Nonresponsive",
    wrongAnswers: ["Narrative", "Speculation", "Hearsay"],
    explanation: "Use this during cross-examination when a witness tries to dodge your 'Yes or No' question by giving a long explanation. You can ask the judge to strike the nonresponsive parts of the answer from the record."
  },
  {
    id: "Form_AskedAnswered",
    category: "Form Objections",
    difficulty: "ORCS",
    prompt: "Question has already been asked and answered.",
    correctAnswer: "Asked and Answered",
    wrongAnswers: ["Compound", "Argumentative", "Cumulative"],
    explanation: "Counsel cannot repeatedly ask the exact same question to emphasize a point or badger the witness. However, if the witness dodged the question the first time, it has been 'asked' but not 'answered', so you can ask it again."
  },
  {
    id: "Form_Compound",
    category: "Form Objections",
    difficulty: "Regionals",
    prompt: "Asking two or more questions at once.",
    correctAnswer: "Compound",
    wrongAnswers: ["Narrative", "Leading", "Argumentative"],
    explanation: "Look for the word 'and' or 'or' in the question. 'Did you go to the store and buy a gun?' is a compound question. The witness might want to answer 'Yes' to the first part and 'No' to the second."
  },
  {
    id: "Form_Argumentative",
    category: "Form Objections",
    difficulty: "ORCS",
    prompt: "Counsel is arguing with or badgering the witness.",
    correctAnswer: "Argumentative",
    wrongAnswers: ["Leading", "Asked and Answered", "Compound"],
    explanation: "Cross-examination can be aggressive, but counsel cannot ask questions that don't seek new facts and instead just try to force the witness to agree to counsel's conclusions (e.g., 'So you're just a liar, aren't you?')."
  },
];