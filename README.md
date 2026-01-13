# melinda-record-match-validator
Validates if 2 records matched by melinda-record-matching can be merged and sets merge priority.

**default** version for matchValidator:
- comparisonTasks suited for automatic import merge of an incoming record and existing database record
- runs comparisonTasks (that are defined usable for import merge) until first point of failure
- returns result for first point of failure, or message for all comparisonTasks not failing / not giving preference change information

**matchValidationForMergeUI** version for matchValidator:
- comparisonTasks suited for internal, manual merge of two database records
- runs all comparisonTasks (that are defined usable for internal, manual merge)
- returns filtered array of failed and edited validation results and preference results changing the preference
- divides failed validation results for manual merge as errors (records cannot be merged) or warnings (user should check whether they actually want to merge records that are not automatically mergable)
- returns empty array, if there are no failures / preference changes

## License and copyright

Copyright (c) 2022-2026 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
