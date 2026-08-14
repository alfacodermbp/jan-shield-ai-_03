const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreComplaint, analyze } = require('../lib/engine');
test('priority engine escalates public safety complaints', () => { const result=scoreComplaint({title:'Flood near school',description:'Unsafe water for 5 days',evidence:true}); assert.equal(result.priority,'CRITICAL'); assert.ok(result.score>=80); });
test('demo AI deterministically understands Hinglish waste report', () => { const result=analyze({title:'Kachra nahi utha',description:'Bhaiya 5 din se kachra nahi utha',ward:'Ward 17'}); assert.equal(result.category,'Waste Management'); assert.equal(result.provider,'DemoAIProvider'); });
