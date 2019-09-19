const { expect, voteFieldHelper, UserWobjects, WobjModel } = require( '../../../testHelper' );
const { voteAppendObjectMocks } = require( './mocks' );


describe( 'Vote On Field', async () => {
    describe( 'when user haven`t weight in wobject', async () => {
        describe( 'on upVote', async () => {
            let mocks;
            let upd_field, exst_field;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                const { field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                exst_field = field;
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: mocks.vote.percent,
                    author_permlink: mocks.author_permlink,
                    weight: 1,
                    rshares_weight: 10
                } );
                upd_field = ( await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink ) ).field;
            } );
            it( 'should increase field weight by one', async () => {
                const diff = upd_field.weight - exst_field.weight;

                expect( diff ).to.eq( 11 );
            } );
            it( 'should increase creator weight by 0.75', async () => {
                const creator_weight = await UserWobjects.findOne( { user_name: mocks.creator.name, author_permlink: mocks.author_permlink } );

                expect( creator_weight.weight ).to.eq( 11 * 0.75 );
            } );
            it( 'should increase voter weight by 0.25', async () => {
                const voter_weight = await UserWobjects.findOne( { user_name: mocks.voter.name, author_permlink: mocks.author_permlink } );

                expect( voter_weight.weight ).to.eq( 11 * 0.25 );
            } );
            it( 'should not create duplicates on active_votes', async () => {
                const count_votes_by_voter = upd_field.active_votes.filter( ( vote ) => vote.voter === mocks.voter.name ).length;
                expect( count_votes_by_voter ).to.eq( 1 );
            } );

        } );
        describe( 'on downVote', async () => {
            /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: upvote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
            let mocks;
            let upd_field, exst_field;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                const { field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                exst_field = field;
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: 9950, // should be rounded to - 100 percent
                    author_permlink: mocks.author_permlink,
                    weight: 1,
                    rshares_weight: 10
                } );

                const { field: new_field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                upd_field = new_field;
            } );
            it( 'should decrease field weight by 1', async () => {
                const diff = upd_field.weight - exst_field.weight;

                expect( diff ).to.eq( -11 );
            } );
            it( 'should decrease creator weight by 0.75', async () => {
                const creator_weight = await UserWobjects.findOne( { user_name: mocks.creator.name, author_permlink: mocks.author_permlink } );

                expect( creator_weight.weight ).to.eq( -11 * 0.75 );
            } );
            it( 'should not create duplicates on active_votes', async () => {
                const count_votes_by_voter = upd_field.active_votes.filter( ( vote ) => vote.voter === mocks.voter.name ).length;
                expect( count_votes_by_voter ).to.eq( 1 );
            } );
        } );
        describe( 'on unVote after upVote', async () => {
            /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: upvote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
            let mocks;
            let upd_field, exst_field;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: mocks.vote.percent, // should be rounded to - 100 percent
                    author_permlink: mocks.author_permlink,
                    weight: 1,
                    rshares_weight: 10
                } );
                const { field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                exst_field = field;
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: 0, // should be rounded to - 100 percent
                    author_permlink: mocks.author_permlink,
                    rshares_weight: 0
                } );
                upd_field = ( await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink ) ).field;
            } );
            it( 'should decrease field weight by 1', async () => {
                const diff = upd_field.weight - exst_field.weight;
                expect( diff ).to.eq( -11 );
            } );
            it( 'should decrease creator weight by 0.75 and became 0', async () => {
                const creator_weight = await UserWobjects.findOne( { user_name: mocks.creator.name, author_permlink: mocks.author_permlink } );
                expect( creator_weight.weight ).to.eq( 0 );
            } );
            it( 'should decrease voter weight by 0.25 and become 0', async () => {
                const voter_weight = await UserWobjects.findOne( { user_name: mocks.voter.name, author_permlink: mocks.author_permlink } );
                expect( voter_weight.weight ).to.eq( 0 );
            } );
        } );
        describe( 'on unVote after downVote', async () => {
            /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: upvote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
            let mocks;
            let upd_field, exst_field;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: 9950, // should be rounded to - 100 percent
                    author_permlink: mocks.author_permlink,
                    weight: 1,
                    rshares_weight: 10
                } );
                const { field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                exst_field = field;
                await voteFieldHelper.voteOnField( {
                    author: mocks.appendObject.author,
                    permlink: mocks.appendObject.permlink,
                    voter: mocks.voter.name,
                    percent: 0, // should be rounded to - 100 percent
                    author_permlink: mocks.author_permlink,
                    rshares_weight: 0
                } );
                const { field: new_field } = await WobjModel.getField( mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink );

                upd_field = new_field;
            } );
            it( 'should increase field weight by 1', async () => {
                const diff = upd_field.weight - exst_field.weight;

                expect( diff ).to.eq( 11 );
            } );
            it( 'should increase creator weight by 0.75 and became 0', async () => {
                const creator_weight = await UserWobjects.findOne( { user_name: mocks.creator.name, author_permlink: mocks.author_permlink } );

                expect( creator_weight.weight ).to.eq( 0 );
            } );
        } );
    } );
} );
