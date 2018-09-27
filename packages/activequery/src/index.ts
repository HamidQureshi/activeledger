/*
 * MIT License (MIT)
 * Copyright (c) 2018 Activeledger
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { ActiveCrypto } from "@activeledger/activecrypto";
import { ActiveDefinitions } from "@activeledger/activedefinitions";
import Client, { CouchDoc, FindOptions } from "davenport";
// @ts-ignore definition missing
import * as sqltomango from "sqltomango";

/**
 *  Query Engine used to look up data on Activeledger
 *
 * @export
 * @class QueryEngine
 */
export class QueryEngine {
  /**
   * Creates an instance of QueryEngine.
   * @param {Client<CouchDoc>} db
   * @param {boolean} [isContract=true]
   * @param {number} [limit=0]
   * @memberof QueryEngine
   */
  constructor(
    private db: Client<CouchDoc>,
    private isContract: boolean = true,
    private limit: number = 0
  ) {}

  /**
   * Use SQL to query the document database
   * TODO : Filter in the query not post search (Use a property)
   *
   * @param {string} sql
   * @returns {Promise<ActiveDefinitions.IState>}
   * @memberof QueryEngine
   */
  public sql(sql: string): Promise<ActiveDefinitions.IState> {
    return new Promise((resolve, reject) => {
      // Convert to json query
      let query = sqltomango.parse(sql) as FindOptions<CouchDoc>;

      // Limit Restrictions
      if (this.limit > 0) {
        query.limit = this.limit;
      }

      // Submit Query
      this.db
        .find(query)
        .then((docs: CouchDoc[]) => {
          // Filter documents if inside a contract
          if (this.isContract || docs.length == 0) {
            let filteredDocs: ActiveDefinitions.IState[] = [];
            let i = docs.length;
            while (i--) {
              // Make sure it isn't a stream document
              // Maybe using a property within this document will be faster
              if (
                (docs[i]._id as string).substring(
                  (docs[i]._id as string).length - 6
                ) != "stream"
              ) {
                filteredDocs.push(docs[i]);
              }
            }
            resolve(filteredDocs);
          } else {
            // Return Raw (Or empty array)
            resolve(docs as ActiveDefinitions.IState);
          }
        })
        .catch(error => {
          reject("Query Failed");
        });
    });
  }
}

export class EventEngine {
  /**
   * Contract Phase
   *
   * @private
   * @memberof EventEngine
   */
  private phase = "vote";

  /**
   * Creates an instance of EventEngine.
   * @param {Client<CouchDoc>} db
   * @param {string} contract
   * @param {*} transaction
   * @memberof EventEngine
   */
  constructor(private db: Client<CouchDoc>, private contract: string) {}

  /**
   * Emit the event to the database
   *
   * @param {string} name
   * @param {*} data
   * @returns {Promise<any>}
   * @memberof EventEngine
   */
  public emit(name: string, data: any): void {
    // Event object to store
    let event: any = {
      name: name,
      data: data,
      phase: this.phase,
      contract: this.contract
    };

    // Fix for pDB
    this.db
      .put(
        ActiveCrypto.Hash.getHash(JSON.stringify(event)),
        event as CouchDoc,
        ""
      )
      .then(() => {})
      .catch(() => {});
  }

  /**
   * Change Phase position
   *
   * @param {string} name
   * @memberof EventEngine
   */
  public setPhase(name: string) {
    this.phase = name;
  }
}