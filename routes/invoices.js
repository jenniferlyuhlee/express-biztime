/** Routes for invoices */

const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require ('../db');

// GET all invoices
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.status(200).json({invoices: results.rows});
    }
    catch(e){
        return next(e);
    }
})

// GET invoice by id
router.get('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description 
                                        FROM invoices AS i 
                                        JOIN companies AS c
                                        ON i.comp_code = c.code
                                        WHERE id = $1`, [id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id ${id}`, 404);
        }
        const data = results.rows[0]
        const invoice = {
            id: data.id, 
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.code,
                name: data.name, 
                description: data.description
            }
        };
        return res.status(200).json({invoice: invoice});
    }
    catch(e){
        return next(e);
    }
})

// POST route to add invoice to db
router.post('/', async (req, res, next) => {
    try{
        const {comp_code, amt} = req.body;
        const results = await db.query(`INSERT INTO invoices(comp_code, amt) 
                                        VALUES ($1, $2) 
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                                        [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});                     
    }
    catch(e){
        return next(e)
    }
})

// PUT route to update invoice data in db
router.put('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const {amt} = req.body;
        const results = await db.query(`UPDATE invoices
                                        SET amt=$2
                                        WHERE id=$1 
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [id, amt]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id ${id}`, 404)
        }
        return res.status(200).json({invoice: results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})


// DELETE invoice
router.delete('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query(`DELETE FROM invoices
                                        WHERE id=$1
                                        RETURNING id`, [id])                               
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id ${id}`, 404)
        }
        return res.status(200).json({status: 'deleted'})
    }
    catch(e){
        return next(e)
    }
})


module.exports = router;