/** Routes for industries */

const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require ('../db');


// GET all industries and associated companies
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT i.code, i.industry, c.code AS company_code
                                        FROM industries AS i
                                        LEFT JOIN company_industries AS ci
                                        ON i.code = ci.ind_code
                                        LEFT JOIN companies AS c
                                        ON c.code = ci.comp_code
                                        `);
        
        // Remove duplication with map
        const industriesMap = new Map();

        // create unique entries
        for (const row of results.rows) {
            const { code, industry, company_code } = row;

            if (!industriesMap.has(code)) {
                industriesMap.set(code, {
                    code: code,
                    industry: industry,
                    companies: []
                });
            }
            // push appropriate companies to companies list
            if (company_code) {
                industriesMap.get(code).companies.push(company_code);
            }
        }

        // Convert the map values to an array
        const newResults = Array.from(industriesMap.values());

        return res.status(200).json({ industries: newResults });
    }
    catch(e){
        return next(e)
    }
})


// POST route to add industry to db
router.post('/', async (req, res, next) => {
    try{
        const {code, industry} = req.body
        const results = await db.query(`INSERT INTO industries (code, industry) 
                                        VALUES ($1, $2) 
                                        RETURNING code, industry`, 
                                        [code, industry]);
        return res.status(201).json({industry: results.rows[0]})                      
    }
    catch(e){
        return next(e)
    }
})

// POST route to associate an industry to a company
router.post('/:indCode', async (req, res, next) => {
    try{
        const {indCode} = req.params;
        const {compCode} = req.body;
        
        // checks if association exists and returns message if it does
        const select = await db.query(`SELECT * FROM company_industries
                                       WHERE ind_code = $1
                                       AND comp_code =$2`, [indCode, compCode])
        if (select.rows[0]){
            return res.status(200).json({already_associated: select.rows[0]})
        }

        // if not will associate industry with company 
        const results = await db.query(`INSERT INTO company_industries (comp_code, ind_code)
                                        VALUES ($1, $2)
                                        RETURNING ind_code, comp_code`, 
                                        [compCode, indCode]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find industry with code ${indCode}`, 404)
        }
        return res.status(200).json({associated: results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})

module.exports = router;