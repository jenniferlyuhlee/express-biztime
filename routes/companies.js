/** Routes for companies */

const express = require('express');
const slugify = require('slugify')
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');


// GET all companies
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM companies`);
        return res.status(200).json({companies: results.rows})
    }
    catch(e){
        return next(e)
    }
})

// GET company by code
router.get('/:code', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT c.code, c.name, c.description, i.industry
                                        FROM companies AS c
                                        LEFT JOIN company_industries AS ci
                                        ON c.code = ci.comp_code
                                        LEFT JOIN industries AS i
                                        ON ci.ind_code = i.code
                                        WHERE c.code = $1`, [req.params.code]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code ${req.params.code}`, 404);
        }

        let {code, name, description} = results.rows[0];
        let industries = results.rows.map(r => r.industry);
        return res.status(200).json({company: {code, name, description, industries}});
    }
    catch(e){
        return next(e)
    }
})

// POST route to add company to db
router.post('/', async (req, res, next) => {
    try{
        const {name, description} = req.body
        const code = slugify(name, {replacement: '-', lower: true})
        const results = await db.query(`INSERT INTO companies (code, name, description) 
                                        VALUES ($1, $2, $3) 
                                        RETURNING code, name, description`, 
                                        [code, name, description]);
        return res.status(201).json({company: results.rows[0]})                      
    }
    catch(e){
        return next(e)
    }
})

// PUT route to update company data in db
router.put('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query(`UPDATE companies
                                  SET name=$2, description=$3 
                                  WHERE code=$1 
                                  RETURNING code, name, description`, [code, name, description]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${code}`, 404)
        }
        return res.status(200).json({company: results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})

// DELETE company
router.delete('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query(`DELETE FROM companies
                                        WHERE code=$1
                                        RETURNING code`, [code])                               
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code ${code}`, 404)
        }
        return res.status(200).json({status: 'deleted'})
    }
    catch(e){
        return next(e)
    }
})

module.exports = router;